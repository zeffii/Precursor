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

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        path = ExtensionUtils.getModulePath(module),
        precursor_path,
        precursor_file = "prototyper.json",
        def_indent = "    ",
        prototypes;

    precursor_path = path + precursor_file;

    $.getJSON(precursor_path, function (data) {
        prototypes = data;
    });

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
        var precursor_object = {current_indent: "", command: trimmed, pos: pos, indent: def_indent};

        if (precursor !== trimmed) {
            // if it gets to this point there is some leftside indentation
            // it may be mixed, i don't care - we consume anyway.
            var slice_index = precursor.indexOf(trimmed);
            var found_indent = precursor.substr(0, slice_index);
            precursor_object.current_indent = found_indent;
        }
        return precursor_object;
    }


    function performRewrite(pmatches, lines, pObj) {
        var currentDoc = DocumentManager.getCurrentDocument(),
            ind = pObj.indent,
            c_ind = pObj.current_indent,
            pos = pObj.pos,
            cooked,
            extent,
            input_template = "",
            line_id,
            line,
            newline = "\n";

        pmatches.indent = ind;

        for (line_id = 0; line_id < lines.length; line_id += 1) {
            line = lines[line_id];
            input_template += (c_ind + line + newline);
        }

        cooked = input_template.format(pmatches);
        extent = pos.ch;
        pos.ch = 0;
        currentDoc.replaceRange(cooked, pos, {line: pos.line, ch: extent});

    }

    function attemptRewrite(pObj) {

        var key,
            plines,
            pregex,
            res,
            num_atoms,
            pmatches = {},
            RE,
            i = 0,
            patterns = prototypes.patterns;

        for (key in patterns) {
            if (patterns.hasOwnProperty(key)) {

                pregex = patterns[key].pattern_regex;
                // console.log("trying:", pregex);
                RE = new RegExp(pregex);
                res = RE.exec(pObj.command);

                // console.log(res);

                if (res) {
                    console.log("matched:", patterns[key].pattern_name);

                    num_atoms = res.length - 1;
                    for (i = 0; i < num_atoms; i += 1) {
                        pmatches[i] = res[i + 1];
                    }
                    // console.log(pmatches);
                    plines = patterns[key].lines;
                    performRewrite(pmatches, plines, pObj);
                    
                    return true;
                }
            }

        }
        return false;
    }



    function testLine() {
        // console.log(prototypes);

        var editor = EditorManager.getActiveEditor();

        if (!editor) {
            return;
        }

        
        // rewriter "precursor" patterns should only ever be on one line, alone.
        // this means we can make some brutal assumptions and log input failures.
        var pos = editor.getCursorPos();
        var lineText = editor.document.getLine(pos.line);
        
        // it's necessary place the cursor at the end of the line before proceeding
        // not sure how to do this neatly.
        editor.setCursorPos({line: pos.line, ch: lineText.length});
		pos = editor.getCursorPos();
        
        // return early if we have nothing to work with.
        if (lineText.trim().length === 0) {
            console.log("Found no content on this line");
            return;
        }

        // The first function creates the pObj abd the second functions adds rewrite info to it.
        var precursorObj = detectIndentationAndCommands(lineText, pos);
        var success = attemptRewrite(precursorObj);

        if (success === false) {
            console.log("Found no precursor on this line, found:", lineText);
        }
    }

    // Keyboard shortcuts to "nudge" value up/down
    var CMD_RW_ID = "zeffii.precursor.testLine";
    var FN_NAME = "Rewrite shortform";

    CommandManager.register(FN_NAME, CMD_RW_ID, testLine);
    KeyBindingManager.addBinding(CMD_RW_ID, "Ctrl-Shift-[");
});