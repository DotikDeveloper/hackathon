import {js as jsBeautify} from 'js-beautify';

export default function formatting (CodeMirror) {
    CodeMirror.extendMode ("css", {
        commentStart: "/*",
        commentEnd: "*/",
        newlineAfterToken: function (_type, content) {
            return /^[;{}]$/.test (content);
        }
    });

    CodeMirror.extendMode ("javascript", {
        commentStart: "/*",
        commentEnd: "*/",
        // FIXME semicolons inside of for
        newlineAfterToken: function (_type, content, textAfter, state) {
            if (this.jsonMode) {
                return /^[\[,{]$/.test (content) || /^}/.test (textAfter);
            } else {
                if (content == ";" && state.lexical && state.lexical.type == ")") return false;
                return /^[;{}]$/.test (content) && !/^;/.test (textAfter);
            }
        }
    });

    var inlineElements = /^(a|abbr|acronym|area|base|bdo|big|br|button|caption|cite|code|col|colgroup|dd|del|dfn|em|frame|hr|iframe|img|input|ins|kbd|label|legend|link|map|object|optgroup|option|param|q|samp|script|select|small|span|strong|sub|sup|textarea|tt|var)$/;

    CodeMirror.extendMode ("xml", {
        commentStart: "<!--",
        commentEnd: "-->",
        newlineAfterToken: function (type, content, textAfter, state) {
            var inline = false;
            if (this.configuration == "html")
                inline = state.context ? inlineElements.test (state.context.tagName) : false;
            return !inline && ((type == "tag" && />$/.test (content) && state.context) ||
                /^</.test (textAfter));
        }
    });

// Comment/uncomment the specified range
    CodeMirror.defineExtension ("commentRange", function (isComment, from, to) {
        var cm = this, curMode = CodeMirror.innerMode (cm.getMode (), cm.getTokenAt (from).state).mode;
        cm.operation (function () {
            if (isComment) { // Comment range
                cm.replaceRange (curMode.commentEnd, to);
                cm.replaceRange (curMode.commentStart, from);
                if (from.line == to.line && from.ch == to.ch) // An empty comment inserted - put cursor inside
                    cm.setCursor (from.line, from.ch + curMode.commentStart.length);
            } else { // Uncomment range
                var selText = cm.getRange (from, to);
                var startIndex = selText.indexOf (curMode.commentStart);
                var endIndex = selText.lastIndexOf (curMode.commentEnd);
                if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
                    // Take string till comment start
                    selText = selText.substr (0, startIndex) +
                        // From comment start till comment end
                        selText.substring (startIndex + curMode.commentStart.length, endIndex) +
                        // From comment end till string end
                        selText.substr (endIndex + curMode.commentEnd.length);
                }
                cm.replaceRange (selText, from, to);
            }
        });
    });

// Applies automatic mode-aware indentation to the specified range
    CodeMirror.defineExtension ("autoIndentRange", function (from, to) {
        var cmInstance = this;
        this.operation (function () {
            for (var i = from.line; i <= to.line; i++) {
                cmInstance.indentLine (i, "smart");
            }
        });
    });

// Applies automatic formatting to the specified range
    CodeMirror.defineExtension ("autoFormatRange", function (from, to) {
        const cm = this;
        cm.operation (function () {
            var selText = cm.getRange (from, to);
            let beautified = jsBeautify (selText, {indent_size: 2, space_in_empty_paren: true});
            cm.replaceRange (beautified, from, to);
        });
    });
}