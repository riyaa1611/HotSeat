HARD_CAP = 8000


def build_context(parsed_repo: dict) -> str:
    parts = [
        f"## Project: {parsed_repo['repo_name']}",
        f"### README\n{parsed_repo['readme']}",
        "### File Structure",
        "\n".join(parsed_repo["file_tree"][:100]),
    ]

    if parsed_repo.get("key_files"):
        parts.append("### Key Configuration Files")
        for fname, content in parsed_repo["key_files"].items():
            parts.append(f"\n**{fname}:**\n```\n{content}\n```")

    return "\n\n".join(parts)[:HARD_CAP]
