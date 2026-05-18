HARD_CAP = 8000


def build_interview_context(resume_text: str, github: dict, role: str) -> str:
    parts = [
        f"## Candidate\nTarget Role: {role}",
        f"### Resume\n{resume_text}",
    ]

    if github.get("username"):
        section = f"### GitHub Profile\nUsername: {github['username']}"
        if github.get("bio"):
            section += f"\nBio: {github['bio']}"
        if github.get("top_repos"):
            section += "\nRecently Active Repositories:"
            for r in github["top_repos"]:
                meta = f"{r['stars']} stars"
                if r.get("pushed_at"):
                    meta += f", last pushed {r['pushed_at']}"
                section += f"\n- {r['name']} ({r['language']}): {r['description']} [{meta}]"
        parts.append(section)

    return "\n\n".join(parts)[:HARD_CAP]
