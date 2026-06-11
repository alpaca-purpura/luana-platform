package main

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// ============================================================================
// Parsers · YAML, checkpoint.md, SYSTEM-MAP, ADRs
// ============================================================================

// loadStories carga todas las stories de un brand.
func loadStories(root, brand string) []Story {
	dir := storiesDir(root, brand)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	var out []Story
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		cp := filepath.Join(dir, e.Name(), "checkpoint.md")
		b, err := os.ReadFile(cp)
		if err != nil {
			continue
		}
		fm := parseFrontmatter(b)
		id := scalar(fm["story_id"])
		if id == "" {
			id = e.Name()
		}
		out = append(out, Story{
			ID:              id,
			Brand:           brand,
			State:           scalar(fm["state"]),
			Release:         scalar(fm["release"]),
			Type:            scalar(fm["type"]),
			CapTarget:       scalar(fm["cap_target"]),
			CapChangeType:   scalar(fm["cap_change_type"]),
			ParentStory:     scalar(fm["parent_story"]),
			PhaseWorkflow:   scalar(fm["phase_workflow"]),
			NextAction:      scalar(fm["next_action"]),
			RatifiedByChris: fm["ratified_by_chris"] == "true",
			DeferAudit:      fm["defer_audit"] == "true",
			BlockedReason:   scalar(fm["blocked_reason"]),
			LastModified:    scalar(fm["last_modified"]),
			LastArtifact:    scalar(fm["last_artifact"]),
			SpawnedBy:       scalar(fm["spawned_by"]),
			DodLiveVerified: fm["dod_live_verified"] == "true",
		})
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].LastModified > out[j].LastModified
	})
	return out
}

// loadReleases carga releases/{brand}/*.yaml.
func loadReleases(root, brand string) []Release {
	dir := filepath.Join(releasesDir(root, brand))
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	var out []Release
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".yaml") {
			continue
		}
		b, err := os.ReadFile(filepath.Join(dir, e.Name()))
		if err != nil {
			continue
		}
		var m map[string]interface{}
		if err := yaml.Unmarshal(b, &m); err != nil {
			continue
		}
		stories := []string{}
		if st, ok := m["stories"].([]interface{}); ok {
			for _, s := range st {
				if sid, ok := s.(string); ok {
					stories = append(stories, sid)
				}
			}
		}
		out = append(out, Release{
			ID:      scalar(fmt.Sprint(m["release_id"])),
			Brand:   brand,
			Name:    scalar(fmt.Sprint(m["name"])),
			Status:  scalar(fmt.Sprint(m["status"])),
			Date:    scalar(fmt.Sprint(m["date"])),
			Stories: stories,
		})
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].ID < out[j].ID
	})
	return out
}

// loadSystemMap carga SYSTEM-MAP.yaml y devuelve zonas.
func loadSystemMap(root, brand string) []Zone {
	file := filepath.Join(root)
	if brand != platformSlug {
		file = filepath.Join(root, brand)
	}
	file = filepath.Join(file, "docs", "architecture", "SYSTEM-MAP.yaml")
	b, err := os.ReadFile(file)
	if err != nil {
		return nil
	}
	var m map[string]interface{}
	if err := yaml.Unmarshal(b, &m); err != nil {
		return nil
	}
	zones := []Zone{}
	if zz, ok := m["zones"].([]interface{}); ok {
		for _, zobj := range zz {
			if z, ok := zobj.(map[string]interface{}); ok {
				zone := Zone{
					Name: scalar(fmt.Sprint(z["name"])),
				}
				if bb, ok := z["boxes"].([]interface{}); ok {
					for _, bobj := range bb {
						if b, ok := bobj.(map[string]interface{}); ok {
							zone.Boxes = append(zone.Boxes, Box{
								Name:        scalar(fmt.Sprint(b["name"])),
								Description: scalar(fmt.Sprint(b["description"])),
							})
						}
					}
				}
				zones = append(zones, zone)
			}
		}
	}
	return zones
}

// loadADRs carga ADR-*.md del scope (platform o brand).
func loadADRs(root, scope string) []ADR {
	var dir string
	if scope == platformSlug {
		dir = filepath.Join(root, "docs", "architecture", "luana-platform")
	} else {
		dir = filepath.Join(root, scope, "docs", "architecture")
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	var out []ADR
	for _, e := range entries {
		if e.IsDir() || !strings.HasPrefix(e.Name(), "ADR-") || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		path := filepath.Join(dir, e.Name())
		b, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		body := string(b)
		id := strings.TrimSuffix(strings.TrimPrefix(e.Name(), ""), ".md")
		title := ""
		if lines := strings.Split(body, "\n"); len(lines) > 0 {
			for _, l := range lines {
				if strings.HasPrefix(l, "# ") {
					title = strings.TrimPrefix(l, "# ")
					break
				}
			}
		}
		status := "proposed"
		if strings.Contains(body, "## Status\n\nAdopted") {
			status = "adopted"
		} else if strings.Contains(body, "## Status\n\nDeprecated") {
			status = "deprecated"
		}
		out = append(out, ADR{
			ID:     id,
			Title:  title,
			Status: status,
			File:   path,
			Body:   body,
		})
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].ID < out[j].ID
	})
	return out
}

// countCapabilities cuenta capabilities en el brand.
func countCapabilities(root, brand string) int {
	dir := capabilitiesDir(root, brand)
	n := 0
	_ = filepath.WalkDir(dir, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			return nil
		}
		name := d.Name()
		if strings.HasSuffix(name, ".yaml") && name != "_template.yaml" {
			n++
		}
		return nil
	})
	return n
}

// ============================================================================
// Helpers
// ============================================================================

var states = []string{
	"idea", "refining", "refined", "ready", "developing",
	"developed", "reviewing", "done", "parked", "dropped",
}

var stateColor = map[string]string{
	"idea": "#94a3b8", "refining": "#60a5fa", "refined": "#38bdf8",
	"ready": "#34d399", "developing": "#fbbf24", "developed": "#f59e0b",
	"reviewing": "#fb923c", "done": "#22c55e", "parked": "#a78bfa", "dropped": "#ef4444",
}

const platformSlug = "platform"

func storiesDir(root, brand string) string {
	if brand == platformSlug {
		return filepath.Join(root, "docs", "product", "stories")
	}
	return filepath.Join(root, brand, "docs", "product", "stories")
}

func releasesDir(root, brand string) string {
	if brand == platformSlug {
		return filepath.Join(root, "docs", "product", "releases")
	}
	return filepath.Join(root, brand, "docs", "product", "releases")
}

func capabilitiesDir(root, brand string) string {
	if brand == platformSlug {
		return filepath.Join(root, "docs", "product", "capabilities")
	}
	return filepath.Join(root, brand, "docs", "product", "capabilities")
}

func parseFrontmatter(b []byte) map[string]string {
	out := map[string]string{}
	s := string(b)
	if !strings.HasPrefix(s, "---") {
		return out
	}
	s = strings.TrimPrefix(s, "---")
	end := strings.Index(s, "\n---")
	if end >= 0 {
		s = s[:end]
	}
	for _, line := range strings.Split(s, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		idx := strings.Index(line, ":")
		if idx < 0 {
			continue
		}
		key := strings.TrimSpace(line[:idx])
		val := strings.TrimSpace(line[idx+1:])
		out[key] = val
	}
	return out
}

func scalar(v string) string {
	if i := strings.Index(v, " #"); i >= 0 {
		v = v[:i]
	}
	v = strings.TrimSpace(v)
	v = strings.Trim(v, `"'`)
	return v
}

func discoverBrands(root string) []string {
	var found []string
	entries, _ := os.ReadDir(root)
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		if st, err := os.Stat(storiesDir(root, e.Name())); err == nil && st.IsDir() {
			found = append(found, e.Name())
		}
	}
	sort.Strings(found)
	if st, err := os.Stat(storiesDir(root, platformSlug)); err == nil && st.IsDir() {
		found = append(found, platformSlug)
	}
	return found
}

func mtimeSignature(root, brand string) string {
	dir := storiesDir(root, brand)
	var latest int64
	count := 0
	_ = filepath.WalkDir(dir, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			return nil
		}
		if info, err := d.Info(); err == nil {
			count++
			if m := info.ModTime().UnixNano(); m > latest {
				latest = m
			}
		}
		return nil
	})
	return fmt.Sprintf("%d-%d", count, latest)
}

func defaultBrand(brands []string) string {
	if v := os.Getenv("DEFAULT_BRAND"); v != "" {
		for _, b := range brands {
			if b == v {
				return v
			}
		}
	}
	for _, b := range brands {
		if b == "vitalia" {
			return b
		}
	}
	if len(brands) > 0 {
		return brands[0]
	}
	return "vitalia"
}

func workspaceRoot() string {
	if v := os.Getenv("WORKSPACE_ROOT"); v != "" {
		if abs, err := filepath.Abs(v); err == nil {
			return abs
		}
	}
	wd, _ := os.Getwd()
	return wd
}

// markdown2html hace un parse muy simple de MD a HTML.
// Suffices para ADRs (headings, lists, code blocks).
func markdown2html(md string) string {
	lines := strings.Split(md, "\n")
	var result []string
	inCode := false
	for _, line := range lines {
		if strings.HasPrefix(line, "```") {
			inCode = !inCode
			if inCode {
				result = append(result, `<pre><code>`)
			} else {
				result = append(result, `</code></pre>`)
			}
			continue
		}
		if inCode {
			result = append(result, escapeHTML(line))
			continue
		}
		line = strings.TrimSpace(line)
		if line == "" {
			result = append(result, `<p></p>`)
			continue
		}
		if strings.HasPrefix(line, "# ") {
			result = append(result, `<h1>`+escapeHTML(strings.TrimPrefix(line, "# "))+`</h1>`)
		} else if strings.HasPrefix(line, "## ") {
			result = append(result, `<h2>`+escapeHTML(strings.TrimPrefix(line, "## "))+`</h2>`)
		} else if strings.HasPrefix(line, "### ") {
			result = append(result, `<h3>`+escapeHTML(strings.TrimPrefix(line, "### "))+`</h3>`)
		} else if strings.HasPrefix(line, "- ") {
			result = append(result, `<li>`+escapeHTML(strings.TrimPrefix(line, "- "))+`</li>`)
		} else {
			result = append(result, `<p>`+escapeHTML(line)+`</p>`)
		}
	}
	return strings.Join(result, "\n")
}

func escapeHTML(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, `"`, "&quot;")
	s = strings.ReplaceAll(s, "'", "&#39;")
	return s
}

func timeNow() string {
	return time.Now().Format("15:04:05")
}
