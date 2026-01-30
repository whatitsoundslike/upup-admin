import subprocess
import sys
import os

def git_push():
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    try:
        # git add
        subprocess.run(
            ["git", "add", "-A", "--", ".", ":!nul"],
            cwd=project_dir,
            check=True,
            capture_output=True,
            text=True,
        )

        # git commit
        result = subprocess.run(
            ["git", "commit", "-m", "auto commit from admin"],
            cwd=project_dir,
            capture_output=True,
            text=True,
        )

        if result.returncode != 0 and "nothing to commit" in result.stdout:
            print("Nothing to commit")
        elif result.returncode != 0:
            print(f"Commit failed: {result.stderr}", file=sys.stderr)
            sys.exit(1)

        # git push
        result = subprocess.run(
            ["git", "push"],
            cwd=project_dir,
            check=True,
            capture_output=True,
            text=True,
        )
        print("Push successful")

    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    git_push()
