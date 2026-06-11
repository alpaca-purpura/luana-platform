package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// Git operations for Fase 3 (Edit integration)

// gitStatus devuelve el status del repo (simplified).
func gitStatus(root string) (bool, string) {
	cmd := exec.Command("git", "-C", root, "status", "--short")
	out, err := cmd.Output()
	if err != nil {
		return false, "not a git repo"
	}
	dirty := len(strings.TrimSpace(string(out))) > 0
	return dirty, string(out)
}

// gitCommit hace commit con mensaje y file list (pathspec).
func gitCommit(root, msg string, files []string) error {
	// Add files by pathspec
	for _, f := range files {
		cmd := exec.Command("git", "-C", root, "add", f)
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("git add %s: %w", f, err)
		}
	}
	// Commit
	cmd := exec.Command("git", "-C", root, "commit", "-m", msg)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("git commit: %w", err)
	}
	return nil
}

// gitPush hace push de los commits.
func gitPush(root string) error {
	cmd := exec.Command("git", "-C", root, "push")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("git push: %w", err)
	}
	return nil
}

// gitMv mueve un archivo + stages el cambio.
func gitMv(root, from, to string) error {
	// Crear dir destino si no existe
	if err := os.MkdirAll(filepath.Dir(to), 0755); err != nil {
		return err
	}
	cmd := exec.Command("git", "-C", root, "mv", from, to)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("git mv: %w", err)
	}
	return nil
}

// archiveStory mueve story de docs/product/stories/{id} a docs/archive/{year}/stories/{id}.
func archiveStory(root, brand, storyID string) error {
	now := time.Now()
	year := fmt.Sprintf("%d", now.Year())

	from := filepath.Join(storiesDir(root, brand), storyID)
	to := filepath.Join(root)
	if brand != platformSlug {
		to = filepath.Join(root, brand)
	}
	to = filepath.Join(to, "docs", "archive", year, "stories", storyID)

	if err := gitMv(root, from, to); err != nil {
		return err
	}
	return gitCommit(root, fmt.Sprintf("archive story %s", storyID), []string{from, to})
}

// writeCheckpoint edita checkpoint.md de una story.
func writeCheckpoint(root, brand, storyID, key, value string) error {
	cpFile := filepath.Join(storiesDir(root, brand), storyID, "checkpoint.md")
	b, err := os.ReadFile(cpFile)
	if err != nil {
		return err
	}
	content := string(b)

	// Reemplaza o agrega el campo en el frontmatter (naive parser).
	fm := parseFrontmatter(b)
	fm[key] = value

	// Rebuild frontmatter
	var newFM strings.Builder
	newFM.WriteString("---\n")
	for k, v := range fm {
		newFM.WriteString(fmt.Sprintf("%s: %s\n", k, v))
	}
	newFM.WriteString("---\n")

	// Rest del contenido (after frontmatter)
	lines := strings.Split(content, "\n")
	inFM := false
	fmCount := 0
	var rest []string
	for _, line := range lines {
		if line == "---" {
			fmCount++
			if fmCount > 1 {
				inFM = false
			}
			continue
		}
		if !inFM || fmCount > 1 {
			rest = append(rest, line)
		}
	}

	newContent := newFM.String() + strings.Join(rest, "\n")
	if err := os.WriteFile(cpFile, []byte(newContent), 0644); err != nil {
		return err
	}
	return gitCommit(root, fmt.Sprintf("update checkpoint: %s=%s", key, value), []string{cpFile})
}

// appendChrisInput agrega una entrada a chris-input.md.
func appendChrisInput(root, brand, storyID, verdict, notes string) error {
	file := filepath.Join(storiesDir(root, brand), storyID, "chris-input.md")

	entry := fmt.Sprintf("\n### %s\n- Verdict: %s\n- Notes: %s\n- Timestamp: %s\n",
		time.Now().Format("2006-01-02 15:04"),
		verdict, notes,
		time.Now().Format(time.RFC3339))

	f, err := os.OpenFile(file, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	if _, err := f.WriteString(entry); err != nil {
		return err
	}
	return gitCommit(root, fmt.Sprintf("append chris-input: %s", verdict), []string{file})
}
