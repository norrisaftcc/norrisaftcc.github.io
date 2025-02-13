/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */

package edu.faytechcc.numberprocessor;


import javax.swing.JOptionPane;
/**
 *
 * @author norrisa8373
 */

public class NumberProcessor {
    /**
     * Processes a string input and attempts to convert it to an integer.
     * This method demonstrates basic input validation and error handling.
     * 
     * Things to consider:
     * 1. What should happen if the user enters nothing?
     * 2. What should happen if the user enters "abc"?
     * 3. What should happen if the user enters "3.14"?
     * 
     * @param input The string that should be converted to an integer
     * @return A message describing what happened during processing
     */


    public static void main(String[] args) {
        // Program will guess a number we think of from 1 to 100
        
        
        // Make an object out of this, so we can call our functions
        NumberProcessor processor = new NumberProcessor();
        
        // Test Case 1: Ask for a number
        Integer num1 = processor.getInteger();
        // Test Case 2: What happens with invalid input?
        //userInput = JOptionPane.showInputDialog("Try entering something that isn't a whole number:");
        //result = processor.process(userInput);
        //JOptionPane.showMessageDialog(null, result);
    }
    
    /**
     * Function: getInteger() - gets an Integer
     * will repeat politely until the user finally gives us a valid int
     * @return answer - the Integer the user typed
     */
    public Integer getInteger() {
        Integer answer = -1; // the number the user types
        while (answer == -1) {
            // Process: Ask for number, validate it, move on
            // input is always a string
            String userInput = JOptionPane.showInputDialog("Enter an integer:");
            // now convert it into a number
            answer = this.process(userInput); // use ourselves (this)
            // Finally, show what we did
            if (answer == -1) {
                JOptionPane.showMessageDialog(null,"That's not an Integer, please try again.");
            }
            else {
                // Debug message
                JOptionPane.showMessageDialog(null, "You entered: " + answer);
            }
        }
        return answer;  
    }
    
    public Integer process(String input) {
        // Convert the string into an Integer
        Integer number = -1; // or some obviously wrong value
        // If we fail, then report error
        // exception handling
        try {
            number = Integer.parseInt(input);
        }
        catch (NumberFormatException e) {
            System.err.println(input + " is not an Integer!");
        }
        return number;        
    }
}
