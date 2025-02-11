public class NumberProcessor {
    /**
     * Processes a string input and attempts to convert it to an integer.
     * This is our original method from Part 1.
     * 
     * @param input The string that should be converted to an integer
     * @return A message describing what happened during processing
     */
    public String process(String input) {
        // Your working code from Part 1 goes here
        return "";
    }

    /**
     * This new overloaded method can handle both integers and decimal numbers.
     * Think about:
     * 1. How should we handle "3.14" differently when isDouble is true vs false?
     * 2. Should we allow "123" when isDouble is true?
     * 3. How can we make our error messages help users enter the right type?
     * 
     * @param input The string to convert to a number
     * @param isDouble If true, convert to decimal; if false, convert to integer
     * @return A message describing what happened during processing
     */
    public String process(String input, boolean isDouble) {
        // Your new code here
        return "";
    }

    public static void main(String[] args) {
        NumberProcessor processor = new NumberProcessor();
        
        // First, let's remind ourselves how our original method works
        String userInput = JOptionPane.showInputDialog("Enter a whole number (using original method):");
        JOptionPane.showMessageDialog(null, processor.process(userInput));
        
        // Now let's try our new method with decimal numbers
        userInput = JOptionPane.showInputDialog("Enter a decimal number:");
        JOptionPane.showMessageDialog(null, processor.process(userInput, true));
        
        // What happens if we try to process a decimal as an integer?
        userInput = JOptionPane.showInputDialog("Enter a decimal number again:");
        JOptionPane.showMessageDialog(null, processor.process(userInput, false));
    }
}
