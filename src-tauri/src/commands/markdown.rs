use pulldown_cmark::{html, Options, Parser};

// Exposes this Rust function to the frontend through Tauri's invoke bridge.
#[tauri::command]
pub fn parse_markdown(markdown: &str) -> String {
    let mut options = Options::empty();
    // pulldown-cmark keeps several GitHub-style markdown features opt-in.
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_TASKLISTS);

    // The parser yields an iterator of markdown events, which push_html turns into a String.
    let parser = Parser::new_ext(markdown, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);
    html_output
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_heading() {
        let result = parse_markdown("# Hello World");
        assert_eq!(result.trim(), "<h1>Hello World</h1>");
    }

    #[test]
    fn test_bold() {
        let result = parse_markdown("**bold**");
        assert_eq!(result.trim(), "<p><strong>bold</strong></p>");
    }

    #[test]
    fn test_strikethrough() {
        // Strikethrough is not enabled by default, so this test drives that parser option.
        let result = parse_markdown("~~strike~~");
        assert_eq!(result.trim(), "<p><del>strike</del></p>");
    }

    #[test]
    fn test_table() {
        let md = "| A | B |\n|---|---|\n| 1 | 2 |";
        let result = parse_markdown(md);
        assert!(result.contains("<table>"));
        assert!(result.contains("<td>1</td>"));
    }

    #[test]
    fn test_tasklist() {
        let md = "- [ ] todo\n- [x] done";
        let result = parse_markdown(md);
        assert!(result.contains(r#"type="checkbox""#));
    }
}
