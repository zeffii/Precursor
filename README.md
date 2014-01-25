### Precursor for Brackets
A simple tool to speed up writing for loops, and similar syntax heavy code constructs that can be described in a more concise way. It only takes a small amount of information to describe what you want, but for the javascript engine to understand you extra syntax is required.

  
#### What to expect
I've bound this to `ctrl+shift+[`  
![iternotator sublime addon, rewrites shorthand to longform](http://t.co/FVNkTg4EhK)

  
#### How is this achieved?
Mostly through a cascade of Regex matching, if the content of a line doesn't match a first pattern it moves on to the next candidate, till it either finds a known valid precursor or establishes that no valid precursor was found on the line. In this case the line can be rewritten from shorthand to longform    


#### How to extend?
An example .json is provided with the extension, it includes the two main regexes that I use to avoid writing for-loops. It unfortunately requires you to escape backslashed regex commands. This means if you need a `\S` you need to write `\\S`, the same applies to any other command that starts with a `\`, they are [listed here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FRegExp#Special_characters_in_regular_expressions).  
  
Note: the current implementation trims the commands before passing them to the regex, therefor the regex is presented with a string that is conveniently matched with some level of condfidence using `^` and `$` at either end. Regexes are tested in the order of appearance in `prototyper.json`.
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

