### Precursor for Brackets
A simple tool to speed up writing for loops, and similar syntax heavy code constructs that can be described in a more concise way. This extention is not ready. come back later.  
  
*What to expect*  
I've bound this to `ctrl+shift+[`  
![iternotator sublime addon, rewrites shorthand to longform](http://t.co/FVNkTg4EhK)
  
*How is this achieved?*  
Mostly through a cascade of Regex matching, if the content of a line doesn't match a first pattern it moves on to the next candidate, till it either finds a known valid precursor or establishes that no valid precursor was found on the line.  

*Once a valid precursor is found*  
In this case the line can be rewritten from shorthand to longform, it only takes a small amount of information to describe what you want, but for the javascript engine to understand you extra syntax is required -- I just don't like writing all that lard.
