### Precursor for Brackets
A simple tool to speed up writing for loops, and similar syntax heavy code constructs, that can be described in a more concise way. It only takes a small amount of information to describe what you want, but for the JavaScript engine to understand you extra syntax is required.

  
#### What to expect
I've bound this to `ctrl+shift+[`  
![rewrites shorthand to longform](http://t.co/FVNkTg4EhK)

  
#### How is this achieved?
Mostly through a cascade of Regex matching, if the content of a line doesn't match a first pattern it moves on to the next candidate, till a match is found. In this case the line can be rewritten from shorthand to longform. 

#### How to extend?
An example .json is provided with the extension, it includes the two main regexs that I use to avoid writing for-loops. It unfortunately requires you to escape backslashed regex commands. This means if you need a `\S` you need to write `\\S`, the same applies to any other command that starts with a `\`, they are [listed here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FRegExp#Special_characters_in_regular_expressions).  
    
Regexs are tested in the order of appearance in `prototyper.json`, think of this as their order of precedence.
```json
{
    "patterns": [
        {
            "pattern_name": "varname:iterations",
            "pattern_regex": "^(\\S+):(\\w+)$",
            "lines": [
                "for (var {0} = 0; {0} < {1}; {0} += 1) {",
                "{indent}{0};",
                "}"
            ]
        },
        {
            "pattern_name": "varname:iterable",
            "pattern_regex": "^(\\S+):(\\w+)\\[\\]?$",
            "lines": [
                "for (var {0} = 0; {0} < {1}.length; {0} += 1) {",
                "{indent}{1}[{0}];",
                "}"
            ]
        }
    ]
}

```

#### Testing
You should test if the addition you make to the `prototyper.json` results in a valid json file before attempting to run the extension. Use something like [jsonlint.com](http://jsonlint.com/) if you aren't sure.

#### Possible issues
The regex will contain at least one match group `( )`, but shouldn't use nested matches. Each set of `( )` will correspond to their numbered counterpart in the `line` property of the pattern. For example `^(\\S+):(\\w+)$` will match 2 parts of the input string, they can be accessed for the rewrite by using `{0}` and `{1}`.  

In the case of no matches, there are a few potential reasons:  

- the regex should be moved up in the `prototyper.json` because likely some other regex is catching the content of the line before it reaches the intended regex.
- the regex is not valid for the content of the line.
- The regex is passed a trimmed version of the line you initiate the command on. Using `^` and `$` at either end of your regex will give more clarity to the pattern to be matched. 
  
The current level of indentation is detected and used to make sure the rewrite happens where expected.  

#### Comments?
Please use the issue tracker, I'll respond when time permits.
