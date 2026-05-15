# Widget Embed Guide (Story 12 T-docs-1)

The Comunify widget lets you embed a community chat bubble on any website —
your personal site, a sales page, or a standalone landing page.

The widget connects visitors directly to your AI community agent (configured
in Brand Studio) and handles lead qualification, membership inquiries,
and community onboarding.

---

## Quick start (2 minutes)

### 1. Get your embed code

In Comunify → Brand Studio → Widget → "Obtener código de inserción":

```html
<!-- Comunify Widget — copy this snippet into your website's <body> -->
<script
  src="https://widget.comunify.lat/embed.js"
  data-tenant="YOUR-TENANT-SLUG"
  data-locale="es-MX"
  async
></script>
```

Replace `YOUR-TENANT-SLUG` with your tenant identifier (visible in Dashboard → Settings).

### 2. Paste before `</body>`

Paste the snippet just before the closing `</body>` tag on any page where you want
the widget to appear.

### 3. That's it

The widget loads asynchronously and won't slow down your page. A chat bubble appears
in the bottom-right corner.

---

## Configuration options

All options are set via `data-*` attributes on the script tag:

| Attribute | Required | Default | Description |
|---|---|---|---|
| `data-tenant` | Yes | — | Your tenant slug (e.g., `anabella-coaching-ar`) |
| `data-locale` | No | `es-MX` | Language locale (`es-MX`, `es-AR`, `es-CL`, `es-PE`, `es-CO`) |
| `data-position` | No | `bottom-right` | Bubble position: `bottom-right`, `bottom-left` |
| `data-theme` | No | `auto` | Color theme: `auto` (uses Brand Studio colors), `light`, `dark` |
| `data-greeting` | No | (from Brand Studio) | Override initial greeting message |
| `data-open-delay` | No | `3000` | Delay in ms before auto-open (0 = no auto-open) |
| `data-z-index` | No | `9999` | CSS z-index for the widget overlay |

### Example with all options

```html
<script
  src="https://widget.comunify.lat/embed.js"
  data-tenant="trini-nutrition-cl"
  data-locale="es-CL"
  data-position="bottom-left"
  data-theme="light"
  data-greeting="Hola, soy el asistente de Trini. ¿En qué puedo ayudarte?"
  data-open-delay="5000"
  async
></script>
```

---

## JavaScript API (advanced)

The widget exposes a global `Comunify` object after load:

```javascript
// Open widget programmatically
Comunify.open();

// Close widget
Comunify.close();

// Send a prefilled message
Comunify.sendMessage("Quiero información sobre la membresía");

// Set visitor metadata (for lead tracking)
Comunify.identify({
  email: "usuario@ejemplo.com",  // optional, for lead enrichment
  name: "María García",
});

// Listen to events
Comunify.on("message_sent", function(data) {
  console.log("User sent:", data.text);
});

Comunify.on("lead_qualified", function(data) {
  // Fires when the AI agent determines the visitor is a qualified lead
  console.log("Lead qualified:", data.score);
  // Use this to trigger your own analytics or CRM integration
});
```

---

## WordPress integration

Install the [Comunify WordPress Plugin](https://wordpress.org/plugins/comunify):

1. Plugins → Add New → Search "Comunify"
2. Install and activate
3. Settings → Comunify → Enter tenant slug + locale
4. Widget appears automatically on all pages

---

## Content Security Policy (CSP)

If your site has a Content Security Policy, add these directives:

```
script-src 'self' https://widget.comunify.lat;
frame-src 'self' https://widget.comunify.lat;
connect-src 'self' https://api.comunify.lat;
img-src 'self' https://comunify.lat data: blob:;
```

---

## Troubleshooting

**Widget not appearing:**
- Verify `data-tenant` matches your tenant slug exactly (case-sensitive)
- Check browser console for errors
- Ensure `widget.comunify.lat` is not blocked by adblocker (test in incognito)

**Widget appears but chat doesn't load:**
- Verify your subscription is active (Dashboard → Billing)
- Check that your AI agent is configured in Brand Studio

**Custom domain widget:**
- Not available in current version. Planned for Q3 2026.

Support: support@comunify.lat
