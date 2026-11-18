use std::path::{Component, Path, PathBuf};

use pulldown_cmark::{html, CowStr, Event, Options, Parser, Tag};

// Exposes this Rust function to the frontend through Tauri's invoke bridge.
// `document_path` is the open file's path (None for unsaved documents); relative
// image links are resolved against its folder so `![](./img.png)` works (issue #3).
#[tauri::command]
pub fn parse_markdown(markdown: &str, document_path: Option<String>) -> String {
    let mut options = Options::empty();
    // pulldown-cmark keeps several GitHub-style markdown features opt-in.
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_TASKLISTS);

    let base_dir = document_path
        .as_deref()
        .and_then(|path| Path::new(path).parent())
        .map(Path::to_path_buf);

    // The parser yields an iterator of markdown events; we rewrite image events, then
    // push_html turns the stream into a String.
    let parser = Parser::new_ext(markdown, options).map(|event| match event {
        Event::Start(Tag::Image { link_type, dest_url, title, id }) => {
            let dest_url = match &base_dir {
                Some(dir) => resolve_image_url(dir, &dest_url).map_or(dest_url, CowStr::from),
                None => dest_url,
            };
            Event::Start(Tag::Image { link_type, dest_url, title, id })
        }
        other => other,
    });

    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);
    html_output
}

/// Turns a relative image link into a URL the webview can load through Tauri's asset
/// protocol. Returns None for anything that isn't a plain relative path.
fn resolve_image_url(base_dir: &Path, url: &str) -> Option<String> {
    let is_relative = !url.is_empty()
        && !url.contains(':') // http:, https:, data:, C:\ ...
        && !url.starts_with('/')
        && !url.starts_with('\\')
        && !url.starts_with('#');
    if !is_relative {
        return None;
    }

    // Drop any ?query or #fragment, then join and tidy `.`/`..` segments lexically.
    let path_part = url.split(['?', '#']).next().unwrap_or(url);
    let mut resolved = PathBuf::new();
    for component in base_dir.join(path_part).components() {
        match component {
            Component::ParentDir => {
                resolved.pop();
            }
            Component::CurDir => {}
            other => resolved.push(other),
        }
    }

    Some(asset_url(&resolved))
}

/// Mirrors `convertFileSrc` from @tauri-apps/api: Windows (and Android) serve assets from
/// http://asset.localhost, other platforms from the asset:// scheme.
fn asset_url(path: &Path) -> String {
    let encoded = encode_uri_component(&path.to_string_lossy());
    if cfg!(any(windows, target_os = "android")) {
        format!("http://asset.localhost/{encoded}")
    } else {
        format!("asset://localhost/{encoded}")
    }
}

/// Same output as JavaScript's encodeURIComponent.
fn encode_uri_component(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for byte in value.bytes() {
        let keep = byte.is_ascii_alphanumeric() || b"-_.!~*'()".contains(&byte);
        if keep {
            out.push(byte as char);
        } else {
            out.push_str(&format!("%{byte:02X}"));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_heading() {
        let result = parse_markdown("# Hello World", None);
        assert_eq!(result.trim(), "<h1>Hello World</h1>");
    }

    #[test]
    fn test_bold() {
        let result = parse_markdown("**bold**", None);
        assert_eq!(result.trim(), "<p><strong>bold</strong></p>");
    }

    #[test]
    fn test_strikethrough() {
        // Strikethrough is not enabled by default, so this test drives that parser option.
        let result = parse_markdown("~~strike~~", None);
        assert_eq!(result.trim(), "<p><del>strike</del></p>");
    }

    #[test]
    fn test_table() {
        let md = "| A | B |\n|---|---|\n| 1 | 2 |";
        let result = parse_markdown(md, None);
        assert!(result.contains("<table>"));
        assert!(result.contains("<td>1</td>"));
    }

    #[test]
    fn test_tasklist() {
        let md = "- [ ] todo\n- [x] done";
        let result = parse_markdown(md, None);
        assert!(result.contains(r#"type="checkbox""#));
    }

    #[test]
    fn test_relative_image_resolves_against_document_folder() {
        let doc = if cfg!(windows) { r"C:\notes\today.md" } else { "/notes/today.md" };
        let result = parse_markdown("![cat](./img/cat.png)", Some(doc.to_string()));
        let expected = if cfg!(windows) {
            r#"src="http://asset.localhost/C%3A%5Cnotes%5Cimg%5Ccat.png""#
        } else {
            r#"src="asset://localhost/%2Fnotes%2Fimg%2Fcat.png""#
        };
        assert!(result.contains(expected), "{result}");
    }

    #[test]
    fn test_parent_segments_in_image_paths_are_resolved() {
        let doc = if cfg!(windows) { r"C:\notes\drafts\today.md" } else { "/notes/drafts/today.md" };
        let result = parse_markdown("![](../shared/a.png)", Some(doc.to_string()));
        assert!(result.contains("shared"), "{result}");
        assert!(!result.contains("drafts"), "{result}");
    }

    #[test]
    fn test_remote_and_data_images_are_left_alone() {
        let doc = Some("/notes/today.md".to_string());
        let remote = parse_markdown("![](https://example.com/a.png)", doc.clone());
        assert!(remote.contains(r#"src="https://example.com/a.png""#));
        let data = parse_markdown("![](data:image/png;base64,AAAA)", doc);
        assert!(data.contains(r#"src="data:image/png;base64,AAAA""#));
    }

    #[test]
    fn test_images_stay_relative_for_unsaved_documents() {
        let result = parse_markdown("![](./a.png)", None);
        assert!(result.contains(r#"src="./a.png""#));
    }

    #[test]
    fn test_encode_uri_component_matches_javascript() {
        assert_eq!(encode_uri_component("a b/c?d"), "a%20b%2Fc%3Fd");
        assert_eq!(encode_uri_component("é"), "%C3%A9");
    }
}
