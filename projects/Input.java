public class NumberProcessor {
    /**
     * Processes a string input and attempts to convert it to an integer.
     * Should handle:
     * - Null/empty input validation
     * - NumberFormatException for invalid numbers
     * - Valid integer conversion
     * 
     * @param input The string to be converted
     * @return A string message indicating success/failure of processing
     */
    public String process(String input) {
        // Your code here
        return "";
    }

    /**
     * Processes a string input and converts it to either an integer or double.
     * Should handle:
     * - Null/empty input validation
     * - NumberFormatException for invalid numbers
     * - Valid number conversion based on isDouble parameter
     * 
     * @param input The string to be converted
     * @param isDouble If true, converts to double; if false, converts to integer
     * @return A string message indicating success/failure of processing
     */
    public String process(String input, boolean isDouble) {
        // Your code here
        return "";
    }

    public static void main(String[] args) {
        NumberProcessor processor = new NumberProcessor();
        String userInput;
        
        // Test Case 1: Valid integer
        userInput = JOptionPane.showInputDialog("Enter an integer:");
        JOptionPane.showMessageDialog(null, processor.process(userInput));

        // Test Case 2: Valid double
        userInput = JOptionPane.showInputDialog("Enter a decimal number:");
        JOptionPane.showMessageDialog(null, processor.process(userInput, true));

        // Test Case 3: Invalid input
        userInput = JOptionPane.showInputDialog("Enter any text (testing invalid input):");
        JOptionPane.showMessageDialog(null, processor.process(userInput));

        // Test Case 4: Empty input
        userInput = JOptionPane.showInputDialog("Press OK without entering anything (testing empty input):");
        JOptionPane.showMessageDialog(null, processor.process(userInput));
    }
}
