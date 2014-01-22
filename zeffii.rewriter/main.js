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

    console.log("monkies!");

    // Brackets modules
    var EditorManager     = brackets.getModule("editor/EditorManager"),
        InlineTextEditor  = brackets.getModule("editor/InlineTextEditor").InlineTextEditor,
        CommandManager    = brackets.getModule("command/CommandManager"),
        KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
        DocumentManager   = brackets.getModule("document/DocumentManager"),
        indent_default    = "    ";

    // necessary for convenient rewriting.
    if (!String.prototype.format) {
        String.prototype.format = function () {
            var str = this.toString();
            console.log(arguments[0]);
            if (!arguments.length) {
                return str;
            }

            //var args = typeof arguments[0];
            var args = arguments[0];
            var arg;
            for (arg in args) {
                // prop is not inherited
                if (args.hasOwnProperty(arg)) {
                    str = str.replace(new RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
                }
            }
            return str;
        };
    }



    console.log("monkies! 2");

    function detectIndentationAndCommands(currentLine) {
        // trim ends to help figure out the indentation level
        var precursor = currentLine.trimRight();
        var trimmed = precursor.trimLeft();
        var precursor_object = {indent: "", command: trimmed};

        if (precursor !== trimmed) {
            // if it gets to this point there is some leftside indentation
            // it may be mixed, i don't care we consume.
            var slice_index = precursor.indexOf(trimmed);
            var found_indent = precursor.substr(0, slice_index);
            precursor_object.indent = found_indent;
        }
        return precursor_object;
    }

    function detectPrecursor(pObj) {
        // dummy function implementation for testing
        return "iter..integer";
    }
    

    function performRewrite(pType, pObj, pos) {
        var currentDoc = DocumentManager.getCurrentDocument();
        var parts;

        console.log("arrives here", pObj);

        if (pType === "iter..integer") {
            parts = pObj.command.split("..");
            var varname = parts[0];
            var num_iterations = parts[1];
            console.log(varname, num_iterations);

            var line1 = "for (var {varname} = 0; {varname} < {num_iterations}; {varname}+= 1) {\n",
                line2 = "    {varname};\n",
                line3 = "}";

            var input_rewritten = line1 + line2 + line3;
            var a = input_rewritten.format({varname: varname, num_iterations: num_iterations});
			var extent = pos.ch;
            pos.ch = 0;
            currentDoc.replaceRange(a, pos, {line: pos.line, ch: extent});
        }

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
            console.log("Found no precursor on this line");
            return;
        }

        var precursorObj = detectIndentationAndCommands(lineText);
        var precursorType = detectPrecursor(precursorObj);
        if (precursorType !== false) {
            performRewrite(precursorType, precursorObj, pos);
        }
    }
    
    // Keyboard shortcuts to "nudge" value up/down
    var CMD_RW_ID = "zeffii.rewriter.testLine";
    var FN_NAME = "Rewrite shortform";

    CommandManager.register(FN_NAME, CMD_RW_ID, testLine);
    KeyBindingManager.addBinding(CMD_RW_ID, "Ctrl-Shift-[");
});