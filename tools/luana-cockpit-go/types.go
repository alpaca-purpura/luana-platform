package main

// Story representa una historia de usuario del checkpoint.md.
type Story struct {
	ID               string
	Brand            string
	Type             string // feature, bugfix
	State            string // idea, refining, refined, ready, developing, developed, reviewing, done, parked, dropped
	Release          string // F0, F1, F2, etc.
	CapTarget        string // capability_id si aplica
	CapChangeType    string // new, fix, extend, derive
	ParentStory      string // si es una sub-story
	PhaseWorkflow    string // PM_DRAFT, PO_DRAFT, ARCH_PENDING, etc.
	NextAction       string
	RatifiedByChris  bool
	DeferAudit       bool
	BlockedReason    string
	LastModified     string // ISO 8601
	LastArtifact     string // checkpoint.md, 03-arch.md, etc.
	SpawnedBy        string // /pm-vitalia
	DodLiveVerified  bool
	DodEvidence      string
}

// Release representa un release (F0, F1, etc.).
type Release struct {
	ID     string
	Brand  string
	Name   string
	Status string // planning, in_progress, ready_to_merge, shipped
	Date   string // ISO 8601 start date
	Stories []string
}

// Capability representa una capability.yaml parsed.
type Capability struct {
	CapabilityID     string
	Module           string
	Slug             string
	Status           string // live, archived
	License          string
	CreatedInStory   string
	CreatedDate      string
	LastModified     string
	PackageVersion   string
	FunctionalArea   []string
	DevPreview       string
	Description      string
	Access           string // public, internal, restricted
	Scenarios        int    // count
	BusinessRules    int
	RelatedCapabilities []string
}

// Zone representa una zona en el SYSTEM-MAP.yaml.
type Zone struct {
	Name  string
	Color string
	Boxes []Box
}

// Box representa una caja dentro de una zona.
type Box struct {
	Name        string
	Description string
	Color       string
}

// ADR representa un Architecture Decision Record.
type ADR struct {
	ID     string // ADR-001-foo
	Title  string
	Date   string // ISO 8601
	Status string // adopted, proposed, deprecated
	File   string // path
	Body   string // HTML rendido
}

// Harness item (Learning / Tech-debt / Drift).
type HarnessItem struct {
	ID       string
	Carril   string // L1, L2, L3, L4
	Title    string
	Severity string // critical, high, medium, low
	Assigned string // Chris, /auditor, etc.
	Due      string // ISO 8601
	Status   string // open, in_progress, done
}

// Learning representa un aprendizaje.
type Learning struct {
	ID         string
	Brand      string
	Date       string
	Title      string
	Type       string // técnico, negocio, process, tooling
	Promotable string // "", candidate, yes
	Body       string
}

// Drift issue.
type DriftIssue struct {
	CapID    string
	Issue    string        // orphan, island, diverge
	Severity string        // critical, high
	CodeRefs []string      // archivos que referencian o no
	Audit    string        // ISO 8601
}

// TabPageData es el contexto para renderizar cualquier tab.
type TabPageData struct {
	Brand      string
	Brands     []string
	Active     string
	Root       string
	Generated  string

	// Board
	Columns []Column
	StoryCount int
	CapsCount int

	// Roadmap
	Releases []Release
	ReleaseTimeline string // HTML

	// Map
	Zones []Zone
	SystemMapTitle string

	// Arquitectura
	ADRs []ADR
	ADRScope string // platform, brand, all

	// Drift
	DriftIssues []DriftIssue

	// Learnings
	LearningsByType map[string][]Learning

	// Harness
	HarnessItems map[string][]HarnessItem // carril → items
}

// Column para board view.
type Column struct {
	State   string
	Color   string
	Stories []Story
}
