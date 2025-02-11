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
    public String process(String input) {
        // Your code here
        return "";
    }

    public static void main(String[] args) {
        NumberProcessor processor = new NumberProcessor();
        
        // Test Case 1: Ask for a number
        String userInput = JOptionPane.showInputDialog("Enter a whole number:");
        String result = processor.process(userInput);
        JOptionPane.showMessageDialog(null, result);
        
        // Test Case 2: What happens with invalid input?
        userInput = JOptionPane.showInputDialog("Try entering something that isn't a whole number:");
        result = processor.process(userInput);
        JOptionPane.showMessageDialog(null, result);
    }
}
