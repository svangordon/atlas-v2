---
title: "Intro to Javascript"
---

Use the Earth Engine Code Editor at https://code.earthengine.google.com

~~~
// Strings
// Create a variable called greeting
var greeting = "Salut"
// Show that variable in the console
print(greeting)

// Create a variable called number
var number = 42
// Display that variable in the console
print(number)

// Create a list called listOfNumbers, and give it the values 4, 5, 6, 7
var listOfNumbers = [4, 5, 6, 7]
// Display that variable in the console
print(listOfNumbers)

// Change the value of number to the second element of listOfNumbers, 6
number = listOfNumbers[2]
// Display the new number
print(number)

// Create a dictionary called Stephen dictionary, that contains information about Stephen
var stephenDictionary = {
  // Create a 'name' property, that contains Stephen's name
  name: "Stephen",
  // Create a 'height' property, that contains Stephen's height
  height: 2.0
}

// Print our dictionary
print(stephenDictionary)


// Add five to a number, and print it
print(number + 5)

// Create a function that has two parameters (aka, 'inputs', aka, 'parameters')
var myFunction = function(input1, input2) {
  // displays the first input
  print("input1 was", input)
  // returns the second input
  return input2
}

// This function always returns the number five. It has no parameters / arguments / inputs
var noInputs = function() {
  return 5
}

// Use our function with number and the value 6. We 'invoke' (aka, 'call', aka, 'run')
// a function by putting parentheses after its name. Any aruments that we are passing
// to the function go in the parentheses.
myFunction(number, 6)

// Assignment: Create a function to add two numbers
function addTwoNumbers(number1, number2) {
  // Put your code below.
  return
}

// Should print: 3
print(addTwoNumbers(1, 2))

// assign the variable sum to
var sum = addTwoNumbers(5, 3)
print('sum', sum)

// Script from afternoon
// https://code.earthengine.google.com/b52b91d8fc819d3c306b4d6170849244
~~~
{:. .source .language-javascript}
