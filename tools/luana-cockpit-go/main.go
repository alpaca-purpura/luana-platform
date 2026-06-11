// Luana Cockpit · Rewrite Go · Fase 1 (Board + Roadmap + Map + Arquitectura)
package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"time"
)

type server struct {
	root   string
	brands []string
	tmpl   map[string]*template.Template
}

func (s *server) brandValid(b string) bool {
	for _, x := range s.brands {
		if x == b {
			return true
		}
	}
	return false
}

// Handlers
func (s *server) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	http.Redirect(w, r, "/board?brand="+defaultBrand(s.brands), http.StatusFound)
}

func (s *server) handleBoard(w http.ResponseWriter, r *http.Request) {
	brand := r.URL.Query().Get("brand")
	if brand == "" || !s.brandValid(brand) {
		brand = defaultBrand(s.brands)
	}

	stories := loadStories(s.root, brand)
	byState := map[string][]Story{}
	for _, st := range stories {
		byState[st.State] = append(byState[st.State], st)
	}
	cols := make([]Column, 0, len(states))
	for _, name := range states {
		cols = append(cols, Column{State: name, Color: stateColor[name], Stories: byState[name]})
	}

	tabs := make([]string, len(s.brands))
	for i, b := range s.brands {
		tabs[i] = b
	}

	data := TabPageData{
		Brand:      brand,
		Brands:     tabs,
		Active:     brand,
		Columns:    cols,
		CapsCount:  countCapabilities(s.root, brand),
		StoryCount: len(stories),
		Root:       s.root,
		Generated:  timeNow(),
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	s.tmpl["board"].Execute(w, data)
}

func (s *server) handleRoadmap(w http.ResponseWriter, r *http.Request) {
	brand := r.URL.Query().Get("brand")
	if brand == "" || !s.brandValid(brand) {
		brand = defaultBrand(s.brands)
	}

	releases := loadReleases(s.root, brand)
	tabs := make([]string, len(s.brands))
	for i, b := range s.brands {
		tabs[i] = b
	}

	data := TabPageData{
		Brand:       brand,
		Brands:      tabs,
		Active:      brand,
		Releases:    releases,
		Root:        s.root,
		Generated:   timeNow(),
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	s.tmpl["roadmap"].Execute(w, data)
}

func (s *server) handleMap(w http.ResponseWriter, r *http.Request) {
	brand := r.URL.Query().Get("brand")
	if brand == "" || !s.brandValid(brand) {
		brand = defaultBrand(s.brands)
	}

	zones := loadSystemMap(s.root, brand)
	tabs := make([]string, len(s.brands))
	for i, b := range s.brands {
		tabs[i] = b
	}

	data := TabPageData{
		Brand:      brand,
		Brands:     tabs,
		Active:     brand,
		Zones:      zones,
		Root:       s.root,
		Generated:  timeNow(),
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	s.tmpl["map"].Execute(w, data)
}

func (s *server) handleArquitectura(w http.ResponseWriter, r *http.Request) {
	brand := r.URL.Query().Get("brand")
if brand == "" || !s.brandValid(brand) {
		brand = defaultBrand(s.brands)
	}
	scope := r.URL.Query().Get("scope")
	if scope == "" {
		scope = "all"
	}

	var adrs []ADR
	if scope == "platform" || scope == "all" {
		adrs = append(adrs, loadADRs(s.root, platformSlug)...)
	}
	if scope == "brand" || scope == "all" {
		adrs = append(adrs, loadADRs(s.root, brand)...)
	}

	tabs := make([]string, len(s.brands))
	for i, b := range s.brands {
		tabs[i] = b
	}

	data := TabPageData{
		Brand:      brand,
		Brands:     tabs,
		Active:     brand,
		ADRs:       adrs,
		ADRScope:   scope,
		Root:       s.root,
		Generated:  timeNow(),
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	s.tmpl["arquitectura"].Execute(w, data)
}

// Fase 2 handlers
func (s *server) handleDrift(w http.ResponseWriter, r *http.Request) {
	brand := r.URL.Query().Get("brand")
	if brand == "" || !s.brandValid(brand) {
		brand = defaultBrand(s.brands)
	}

	drift := detectDrift(s.root, brand)
	tabs := make([]string, len(s.brands))
	for i, b := range s.brands {
		tabs[i] = b
	}

	data := TabPageData{
		Brand:       brand,
		Brands:      tabs,
		Active:      brand,
		DriftIssues: drift,
		Root:        s.root,
		Generated:   timeNow(),
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	s.tmpl["drift"].Execute(w, data)
}

func (s *server) handleLearnings(w http.ResponseWriter, r *http.Request) {
	brand := r.URL.Query().Get("brand")
	if brand == "" || !s.brandValid(brand) {
		brand = defaultBrand(s.brands)
	}

	learnings := loadLearnings(s.root, brand)
	byType := make(map[string][]Learning)
	for _, l := range learnings {
		byType[l.Type] = append(byType[l.Type], l)
	}

	tabs := make([]string, len(s.brands))
	for i, b := range s.brands {
		tabs[i] = b
	}

	data := TabPageData{
		Brand:           brand,
		Brands:          tabs,
		Active:          brand,
		LearningsByType: byType,
		Root:            s.root,
		Generated:       timeNow(),
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	s.tmpl["learnings"].Execute(w, data)
}

func (s *server) handleHarness(w http.ResponseWriter, r *http.Request) {
	brand := r.URL.Query().Get("brand")
	if brand == "" || !s.brandValid(brand) {
		brand = defaultBrand(s.brands)
	}

	items := loadHarnessItems(s.root, brand)
	tabs := make([]string, len(s.brands))
	for i, b := range s.brands {
		tabs[i] = b
	}

	data := TabPageData{
		Brand:        brand,
		Brands:       tabs,
		Active:       brand,
		HarnessItems: items,
		Root:         s.root,
		Generated:    timeNow(),
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	s.tmpl["harness"].Execute(w, data)
}

// API · Fase 3 (Edit)
func (s *server) handleTransition(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	storyID := r.FormValue("story_id")
	brand := r.FormValue("brand")
	newState := r.FormValue("state")
	rationale := r.FormValue("rationale")

	if !s.brandValid(brand) {
		http.Error(w, "brand inválida", http.StatusBadRequest)
		return
	}

	// Update checkpoint
	if err := writeCheckpoint(s.root, brand, storyID, "state", newState); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Git push
	if err := gitPush(s.root); err != nil {
		// Log pero no bloquea
		log.Printf("git push error: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"status":"ok","story_id":"%s","state":"%s"}`, storyID, newState)
}

func (s *server) handleChrisInputWrite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	storyID := r.FormValue("story_id")
	brand := r.FormValue("brand")
	verdict := r.FormValue("verdict")
	notes := r.FormValue("notes")

	if !s.brandValid(brand) {
		http.Error(w, "brand inválida", http.StatusBadRequest)
		return
	}

	if err := appendChrisInput(s.root, brand, storyID, verdict, notes); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := gitPush(s.root); err != nil {
		log.Printf("git push error: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"status":"ok","verdict":"%s"}`, verdict)
}

func (s *server) handleReleaseMerge(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	releaseID := r.FormValue("release_id")
	brand := r.FormValue("brand")

	if !s.brandValid(brand) {
		http.Error(w, "brand inválida", http.StatusBadRequest)
		return
	}

	// Load release
	releases := loadReleases(s.root, brand)
	var rel *Release
	for i := range releases {
		if releases[i].ID == releaseID {
			rel = &releases[i]
			break
		}
	}
	if rel == nil {
		http.Error(w, "release not found", http.StatusNotFound)
		return
	}

	// Archive each story
	for _, storyID := range rel.Stories {
		if err := archiveStory(s.root, brand, storyID); err != nil {
			log.Printf("archive %s error: %v", storyID, err)
		}
	}

	// Update release status
	if err := writeCheckpoint(s.root, brand, releaseID, "status", "shipped"); err != nil {
		log.Printf("update release error: %v", err)
	}

	if err := gitPush(s.root); err != nil {
		log.Printf("git push error: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"status":"ok","release_id":"%s","archived":%d}`, releaseID, len(rel.Stories))
}

// API · Salud
func (s *server) handleHealth(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "ok · brands=%d · root=%s\n", len(s.brands), s.root)
}

func (s *server) handleEvents(w http.ResponseWriter, r *http.Request) {
	brand := r.URL.Query().Get("brand")
	if !s.brandValid(brand) {
		http.Error(w, "brand desconocida", http.StatusBadRequest)
		return
	}
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming no soportado", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	ctx := r.Context()
	last := mtimeSignature(s.root, brand)
	ticker := time.NewTicker(1500 * time.Millisecond)
	defer ticker.Stop()
	heartbeat := time.NewTicker(30 * time.Second)
	defer heartbeat.Stop()

	fmt.Fprintf(w, "data: connected\n\n")
	flusher.Flush()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			cur := mtimeSignature(s.root, brand)
			if cur != last {
				last = cur
				fmt.Fprintf(w, "data: reload\n\n")
				flusher.Flush()
			}
		case <-heartbeat.C:
			fmt.Fprintf(w, "data: heartbeat\n\n")
			flusher.Flush()
		}
	}
}

// Bootstrap
func parseTemplates() map[string]*template.Template {
	out := map[string]*template.Template{}
	out["board"] = template.Must(template.New("board").Parse(boardHTML))
	out["roadmap"] = template.Must(template.New("roadmap").Parse(roadmapHTML))
	out["map"] = template.Must(template.New("map").Parse(mapHTML))
	out["arquitectura"] = template.Must(template.New("arquitectura").Parse(arquitecturaHTML))
	out["drift"] = template.Must(template.New("drift").Parse(driftHTML))
	out["learnings"] = template.Must(template.New("learnings").Parse(learningsHTML))
	out["harness"] = template.Must(template.New("harness").Parse(harnessHTML))
	return out
}

func main() {
	root := workspaceRoot()
	brands := discoverBrands(root)
	if len(brands) == 0 {
		log.Fatalf("no se encontraron marcas con docs/product/stories bajo %s", root)
	}

	tmpl := parseTemplates()
	srv := &server{root: root, brands: brands, tmpl: tmpl}

	mux := http.NewServeMux()
	// Tabs
	mux.HandleFunc("/", srv.handleRoot)
	mux.HandleFunc("/board", srv.handleBoard)
	mux.HandleFunc("/roadmap", srv.handleRoadmap)
	mux.HandleFunc("/map", srv.handleMap)
	mux.HandleFunc("/arquitectura", srv.handleArquitectura)
	mux.HandleFunc("/drift", srv.handleDrift)
	mux.HandleFunc("/learnings", srv.handleLearnings)
	mux.HandleFunc("/harness", srv.handleHarness)
	// APIs
	mux.HandleFunc("/health", srv.handleHealth)
	mux.HandleFunc("/events", srv.handleEvents)
	// Fase 3 · Edit
	mux.HandleFunc("POST /api/transition", srv.handleTransition)
	mux.HandleFunc("POST /api/chris-input", srv.handleChrisInputWrite)
	mux.HandleFunc("POST /api/release/merge", srv.handleReleaseMerge)

	port := os.Getenv("PORT")
	if port == "" {
		port = "4102"
	}
	addr := ":" + port
	log.Printf("🏥 Luana Cockpit (Go · Fase 1) · root=%s · brands=%v", root, brands)
	log.Printf("→ http://localhost%s/board", addr)

	httpSrv := &http.Server{Addr: addr, Handler: mux, ReadHeaderTimeout: 10 * time.Second}
	log.Fatal(httpSrv.ListenAndServe())
}

// ============================================================================
// HTML Templates
// ============================================================================

const baseNav = `
<header>
  <h1>🏥 Luana Cockpit <span class="muted">· Go Fase 1</span></h1>
  <span class="pill">marca: {{.Active}}</span>
</header>
<nav>
  <a href="/board?brand={{.Active}}" class="tab">Board</a>
  <a href="/roadmap?brand={{.Active}}" class="tab">Roadmap</a>
  <a href="/map?brand={{.Active}}" class="tab">Map</a>
  <a href="/arquitectura?brand={{.Active}}" class="tab">Arquitectura</a>
  <span class="muted" style="margin-left:auto">
    {{range .Brands}}<a href="/board?brand={{.}}" class="brand-link" {{if eq . $.Active}}style="font-weight:600;color:#fff"{{end}}>{{.}}</a> {{end}}
  </span>
  <span class="muted" id="conn">● conectando…</span>
</nav>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 13px/1.4 -apple-system, "Segoe UI", system-ui, sans-serif;
         background: #0b1020; color: #e2e8f0; }
  header { display: flex; align-items: center; gap: 14px; padding: 10px 16px;
           border-bottom: 1px solid #1e293b; background: #0f152b; position: sticky; top: 0; z-index: 10; }
  header h1 { font-size: 15px; margin: 0; font-weight: 600; }
  .muted { color: #64748b; }
  .pill { background: #1e293b; border-radius: 999px; padding: 2px 9px; font-size: 11px; }
  nav { display: flex; gap: 8px; align-items: center; padding: 8px 16px; border-bottom: 1px solid #1e293b; }
  nav a { text-decoration: none; color: #94a3b8; padding: 4px 10px; border-radius: 6px;
          font-size: 12px; border: 1px solid transparent; }
  nav a:hover { background: #1e293b; }
  nav a.tab { font-weight: 600; }
  .brand-link { font-size: 11px; }
  .content { padding: 14px 16px; }
  .col { min-width: 215px; flex: 0 0 auto; }
  .col h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
            margin: 0 0 8px; display: flex; align-items: center; gap: 6px; color: #cbd5e1; }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .card { background: #131a30; border: 1px solid #1e293b; border-left-width: 3px;
          border-radius: 7px; padding: 8px 9px; margin-bottom: 7px; }
  .card .id { font-weight: 600; font-size: 12px; word-break: break-word; }
  .card .meta { margin-top: 4px; display: flex; gap: 5px; flex-wrap: wrap; }
  .tag { font-size: 10px; background: #1e293b; border-radius: 4px; padding: 1px 5px; color: #94a3b8; }
  .card .na { margin-top: 5px; color: #64748b; font-size: 11px;
              display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .empty { color: #334155; font-size: 11px; font-style: italic; padding: 4px 0; }
  .board { display: flex; gap: 10px; padding: 14px 16px; overflow-x: auto; align-items: flex-start; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th { text-align: left; padding: 8px; border-bottom: 1px solid #334155; font-weight: 600; color: #cbd5e1; }
  td { padding: 8px; border-bottom: 1px solid #1e293b; }
  .zone { margin: 14px 0; padding: 12px; background: #131a30; border-radius: 7px; }
  .zone h3 { margin: 0 0 8px; color: #cbd5e1; }
  .boxes { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
  .box { background: #0f152b; border: 1px solid #334155; border-radius: 6px; padding: 10px; }
  .adr-item { margin: 12px 0; padding: 10px; background: #131a30; border-radius: 6px; border-left: 3px solid #60a5fa; }
  .adr-item .title { font-weight: 600; font-size: 14px; }
  .adr-item .meta { color: #94a3b8; font-size: 11px; margin-top: 4px; }
  footer { padding: 8px 16px; color: #475569; font-size: 11px; border-top: 1px solid #1e293b; }
</style>
`

const boardHTML = baseNav + `
{{template "board-content" .}}
<footer>{{.StoryCount}} stories · {{.CapsCount}} caps · {{.Generated}}</footer>
<script>
  const es = new EventSource('/events?brand={{.Active}}');
  const conn = document.getElementById('conn');
  es.onopen = () => { conn.textContent = '● watching {{.Active}}'; conn.style.color = '#22c55e'; };
  es.onerror = () => { conn.textContent = '● reconectando…'; conn.style.color = '#fbbf24'; };
  es.onmessage = (e) => { if (e.data === 'reload') location.reload(); };
</script>
{{define "board-content"}}
<div class="board">
  {{range .Columns}}
  {{$col := .}}
  <div class="col">
    <h2><span class="dot" style="background:{{$col.Color}}"></span>{{$col.State}} <span class="muted">{{len $col.Stories}}</span></h2>
    {{range $col.Stories}}
    <div class="card" style="border-left-color:{{$col.Color}}">
      <div class="id">{{.ID}}</div>
      <div class="meta">{{if .Release}}<span class="tag">{{.Release}}</span>{{end}} {{if .Type}}<span class="tag">{{.Type}}</span>{{end}}</div>
      {{if .NextAction}}<div class="na">{{.NextAction}}</div>{{end}}
    </div>
    {{else}}
    <div class="empty">—</div>
    {{end}}
  </div>
  {{end}}
</div>
{{end}}
`

const roadmapHTML = baseNav + `
<div class="content">
  <h2>Releases · {{.Active}}</h2>
  <table>
    <tr><th>Release</th><th>Status</th><th>Stories</th></tr>
    {{range .Releases}}
    <tr>
      <td><strong>{{.ID}}</strong> {{.Name}}</td>
      <td><span class="tag">{{.Status}}</span></td>
      <td>{{len .Stories}}</td>
    </tr>
    {{end}}
  </table>
</div>
<footer>{{.Generated}}</footer>
<script>
  const es = new EventSource('/events?brand={{.Active}}');
  document.getElementById('conn').textContent = '● watching {{.Active}}';
  es.onerror = () => document.getElementById('conn').textContent = '● reconectando…';
  es.onmessage = (e) => { if (e.data === 'reload') location.reload(); };
</script>
`

const mapHTML = baseNav + `
<div class="content">
  <h2>SYSTEM-MAP · {{.Active}}</h2>
  {{range .Zones}}
  <div class="zone">
    <h3>{{.Name}}</h3>
    <div class="boxes">
      {{range .Boxes}}
      <div class="box">
        <strong>{{.Name}}</strong>
        {{if .Description}}<p style="color:#94a3b8;font-size:11px;margin:4px 0 0">{{.Description}}</p>{{end}}
      </div>
      {{end}}
    </div>
  </div>
  {{end}}
</div>
<footer>{{.Generated}}</footer>
<script>
  const es = new EventSource('/events?brand={{.Active}}');
  document.getElementById('conn').textContent = '● watching {{.Active}}';
  es.onerror = () => document.getElementById('conn').textContent = '● reconectando…';
  es.onmessage = (e) => { if (e.data === 'reload') location.reload(); };
</script>
`

const arquitecturaHTML = baseNav + `
<div class="content">
  <h2>Architecture Decision Records</h2>
  <label>Scope:
    <select onchange="window.location = '/arquitectura?brand={{.Active}}&scope=' + this.value">
      <option value="all" {{if eq .ADRScope "all"}}selected{{end}}>all</option>
      <option value="platform" {{if eq .ADRScope "platform"}}selected{{end}}>platform</option>
      <option value="brand" {{if eq .ADRScope "brand"}}selected{{end}}>{{.Active}}</option>
    </select>
  </label>
  {{range .ADRs}}
  <div class="adr-item">
    <div class="title">{{.ID}} — {{.Title}}</div>
    <div class="meta">Status: <span class="tag">{{.Status}}</span></div>
  </div>
  {{end}}
</div>
<footer>{{.Generated}}</footer>
<script>
  const es = new EventSource('/events?brand={{.Active}}');
  document.getElementById('conn').textContent = '● watching {{.Active}}';
  es.onerror = () => document.getElementById('conn').textContent = '● reconectando…';
  es.onmessage = (e) => { if (e.data === 'reload') location.reload(); };
</script>
`

const driftHTML = baseNav + `
<div class="content">
  <h2>Drift (Cap ↔ Código)</h2>
  {{if .DriftIssues}}
  <table>
    <tr><th>Capability</th><th>Issue</th><th>Severity</th></tr>
    {{range .DriftIssues}}
    <tr><td>{{.CapID}}</td><td>{{.Issue}}</td><td><span class="tag" style="background:{{if eq .Severity "critical"}}#ef4444{{else if eq .Severity "high"}}#f59e0b{{else}}#eab308{{end}}">{{.Severity}}</span></td></tr>
    {{end}}
  </table>
  {{else}}
  <p class="empty">Sin divergencias detectadas.</p>
  {{end}}
</div>
<footer>{{.Generated}}</footer>
<script>
  const es = new EventSource('/events?brand={{.Active}}');
  document.getElementById('conn').textContent = '● watching {{.Active}}';
  es.onerror = () => document.getElementById('conn').textContent = '● reconectando…';
  es.onmessage = (e) => { if (e.data === 'reload') location.reload(); };
</script>
`

const learningsHTML = baseNav + `
<div class="content">
  <h2>Learnings</h2>
  {{range $type, $items := .LearningsByType}}
  <h3>{{$type}}</h3>
  {{range $items}}
  <div class="adr-item">
    <div class="title">{{.Title}}</div>
    <div class="meta">{{.Date}} {{if .Promotable}}<span class="tag" style="background:#22c55e">promotable: {{.Promotable}}</span>{{end}}</div>
  </div>
  {{end}}
  {{end}}
</div>
<footer>{{.Generated}}</footer>
<script>
  const es = new EventSource('/events?brand={{.Active}}');
  document.getElementById('conn').textContent = '● watching {{.Active}}';
  es.onerror = () => document.getElementById('conn').textContent = '● reconectando…';
  es.onmessage = (e) => { if (e.data === 'reload') location.reload(); };
</script>
`

const harnessHTML = baseNav + `
<div class="content">
  <h2>Harness · CIL 4 Carriles</h2>
  {{range $carril, $items := .HarnessItems}}
  {{if $items}}
  <h3>{{$carril}} · {{len $items}} items</h3>
  <table>
    <tr><th>ID</th><th>Title</th><th>Status</th><th>Severity</th></tr>
    {{range $items}}
    <tr><td>{{.ID}}</td><td>{{.Title}}</td><td><span class="tag">{{.Status}}</span></td><td>{{.Severity}}</td></tr>
    {{end}}
  </table>
  {{end}}
  {{end}}
</div>
<footer>{{.Generated}}</footer>
<script>
  const es = new EventSource('/events?brand={{.Active}}');
  document.getElementById('conn').textContent = '● watching {{.Active}}';
  es.onerror = () => document.getElementById('conn').textContent = '● reconectando…';
  es.onmessage = (e) => { if (e.data === 'reload') location.reload(); };
</script>
`
