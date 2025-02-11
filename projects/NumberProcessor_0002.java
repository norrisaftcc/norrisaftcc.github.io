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
        // Make an object out of this, so we can call our functions
        NumberProcessor processor = new NumberProcessor();
        
        // Test Case 1: Ask for a number
        // input is always a string
        String userInput = JOptionPane.showInputDialog("Enter a whole number:");
        
        // now convert it into a number
        Integer result = processor.process(userInput);
        // Finally, show what we did
        if (result == -1) {
            JOptionPane.showMessageDialog(null,"That's not an Integer");
        }
        else {
            JOptionPane.showMessageDialog(null, result);
        }
        // Test Case 2: What happens with invalid input?
        userInput = JOptionPane.showInputDialog("Try entering something that isn't a whole number:");
        result = processor.process(userInput);
        JOptionPane.showMessageDialog(null, result);
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
