/*
 * Copyright (c) 2014 Dealga McArdle.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";

    console.log("Precursor Active!");

    // Brackets modules
    var EditorManager     = brackets.getModule("editor/EditorManager"),
        InlineTextEditor  = brackets.getModule("editor/InlineTextEditor").InlineTextEditor,
        CommandManager    = brackets.getModule("command/CommandManager"),
        KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
        DocumentManager   = brackets.getModule("document/DocumentManager"),
        indent_default    = "    ";

    // necessary for convenient rewriting.
    if (!String.prototype.format) {
        String.prototype.format = function (args) {
            var str = this.toString();
            if (!arguments.length) {
                return str;
            }

            var arg;
            for (arg in args) {
                if (args.hasOwnProperty(arg)) {
                    str = str.replace(new RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
                }
            }
            return str;
        };
    }

    function detectIndentationAndCommands(currentLine, pos) {
        // trim ends to help figure out the indentation level
        var precursor = currentLine.trimRight();
        var trimmed = precursor.trimLeft();
        var precursor_object = {indent: "", command: trimmed, pos: pos};

        if (precursor !== trimmed) {
            // if it gets to this point there is some leftside indentation
            // it may be mixed, i don't care - we consume anyway.
            var slice_index = precursor.indexOf(trimmed);
            var found_indent = precursor.substr(0, slice_index);
            precursor_object.indent = found_indent;
        }
        return precursor_object;
    }

    function detectPrecursor(pObj) {
        // set some defaults and prepare variables for use.
        pObj.pType = false;
        var cmds = pObj.command,
            pattern,
            res;

        // test for i:iterable[] or i:iterable[
        pattern = /(\S+:\w+)\[\]?/;
        res = cmds.match(pattern);
        if (res) {
            pObj.pType = "iter:array";
            pObj.matched = res[1];
            return pObj;
        }

        pattern = /^(\S+:\w+)$/;
        res = cmds.match(pattern);
        if (res) {
            pObj.pType = "iter:variable";
            pObj.matched = res[1];
            return pObj;
        }

        // return an object, no matter what. if unmatched in regex list
        // .pType will be false as a guarantee.
        return pObj;
    }

    function performRewrite(pObj) {
        /*  this function should only ever be called with a recognized pType
         *  so directly mapping pType to actions/rewrites can occur without
         *  much error checking.
         */

        var currentDoc = DocumentManager.getCurrentDocument(),
            input_template,
            sanitized_parts = {},
            ind = pObj.indent,
            pos = pObj.pos,
            pType = pObj.pType,
            parts,
            varname,
            line1,
            line2,
            line3;

        // both are acted upon in the same way
        if (pType === "iter:integer" || pType === "iter:variable") {
            parts = pObj.command.split(":");
            varname = parts[0];
            var num_iterations = parts[1];

            line1 = "for (var {varname} = 0; {varname} < {num_iterations}; {varname} += 1) {\n";
            line2 = "    {varname};\n";
            line3 = "}";

            input_template = ind + line1 + ind + line2 + ind + line3;
            sanitized_parts = {varname: varname, num_iterations: num_iterations};

        } else if (pType === "iter:array") {
            parts = pObj.matched.split(":");
            varname = parts[0];
            var iterable = parts[1];

            line1 = "for (var {varname} = 0; {varname} < {iterable}.length; {varname} += 1) {\n";
            line2 = "    {iterable}[{varname}];\n";
            line3 = "}";

            input_template = ind + line1 + ind + line2 + ind + line3;
            sanitized_parts = {varname: varname, iterable: iterable};
        }

        // these are to be performed on all precursor objects
        var cooked = input_template.format(sanitized_parts);
        var extent = pos.ch;
        pos.ch = 0;
        currentDoc.replaceRange(cooked, pos, {line: pos.line, ch: extent});

    }

    function testLine() {
        var editor = EditorManager.getActiveEditor();

        if (!editor) {
            return;
        }

        // rewriter "precursor" patterns should only ever be on one line, alone.
        // this means we can make some brutal assumptions and log input failures.
        var pos = editor.getCursorPos();
        var lineText = editor.document.getLine(pos.line);

        // return early if we have nothing to work with.
        if (lineText.trim().length === 0) {
            console.log("Found no content on this line");
            return;
        }

        // The first function creates the pObj abd the second functions adds rewrite info to it.
        var precursorObj = detectIndentationAndCommands(lineText, pos);
        precursorObj = detectPrecursor(precursorObj);
        
        if (precursorObj.pType !== false) {
            performRewrite(precursorObj);
            return;
        }
        
        // reaching here is a last resort.
        console.log("Found no precursor on this line, found:", lineText);
    }

    // Keyboard shortcuts to "nudge" value up/down
    var CMD_RW_ID = "zeffii.rewriter.testLine";
    var FN_NAME = "Rewrite shortform";

    CommandManager.register(FN_NAME, CMD_RW_ID, testLine);
    KeyBindingManager.addBinding(CMD_RW_ID, "Ctrl-Shift-[");
});