# pinnableTooltip

Attach a rich HTML tooltip that behaves like [`richTooltip()`](richTooltip.md) on hover/focus, but can also be **pinned open** by clicking the target element. A pinned tooltip stays visible (it ignores `mouseleave`/`focusout`) and follows its anchor as the page scrolls or resizes. Clicking the target again unpins it.

This is opt-in sugar over `richTooltip()` with `{ pinnable: true }`. The default `tooltip()` / `richTooltip()` behavior is unchanged — they are never pinnable.

## Signature

```javascript
modal.pinnableTooltip(pElement, pHTMLContent, pOptions)
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| pElement | HTMLElement | Yes | The target element. Hover/focus shows the tooltip; a click toggles its pinned state |
| pHTMLContent | string | Yes | HTML string rendered inside the tooltip body via `innerHTML` |
| pOptions | object | No | Configuration options (see below) |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| position | string | `"top"` | Preferred placement: `"top"`, `"bottom"`, `"left"`, or `"right"` |
| delay | number | `200` | Delay in milliseconds before the tooltip appears on hover/focus |
| maxWidth | string | `"300px"` | CSS max-width for the tooltip element |
| interactive | boolean | `false` | When `true`, the user can move their cursor into the tooltip without it disappearing |
| startPinned | boolean | `false` | When `true`, the tooltip is rendered already pinned |
| onPinChange | function | — | Called with `(pIsPinned, pElement)` whenever the pinned state changes. Use it to persist a per-anchor preference |
| className | string | — | Extra class(es) added to the tooltip element. Use it to theme a specific tooltip by overriding the `--pict-modal-tooltip-*` custom properties (bubble + arrow follow `--pict-modal-tooltip-bg`) |

## Returns

`{ destroy, pin, unpin, isPinned }`

| Member | Type | Description |
|--------|------|-------------|
| destroy | function | Removes the tooltip and all event listeners (including the click and scroll/resize listeners) |
| pin | function | Pins the tooltip open programmatically |
| unpin | function | Unpins (and hides) the tooltip programmatically |
| isPinned | function | Returns the current pinned state as a boolean |

## Example

### Click to pin

```javascript
let tmpChip = document.querySelector('#chip-external-db');
let tmpHandle = modal.pinnableTooltip(tmpChip,
	'<strong>External DB ID:</strong> 48217',
	{ position: 'top', interactive: true }
);
```

### Rendered already-pinned, with persistence

```javascript
modal.pinnableTooltip(tmpChip,
	'<strong>New record</strong>',
	{
		startPinned: true,
		onPinChange: (pIsPinned) =>
		{
			// e.g. remember the user's choice for this chip type
			saveChipPreference('New', pIsPinned);
		}
	}
);
```

### Programmatic control

```javascript
let tmpHandle = modal.pinnableTooltip(tmpElement, '<em>Details</em>');
tmpHandle.pin();
console.log(tmpHandle.isPinned()); // true
tmpHandle.unpin();
tmpHandle.destroy();
```

## Notes

- Pinning is **opt-in**. Without `pinnable` (which `pinnableTooltip()` sets for you), a tooltip is transient — there is no click behavior.
- A pinned tooltip is `position: fixed` and portaled to `<body>`. While pinned, `scroll` (captured) and `resize` listeners keep it glued to its anchor; if the anchor scrolls out of the viewport the tooltip fades out (without dropping the pin) and returns when the anchor does.
- A pinned (or `startPinned`) tooltip whose anchor is **not rendered** — `display:none`, or inside a hidden container such as an inactive tab panel — is not painted; it stays hidden and appears the moment the anchor gains a layout box. A `ResizeObserver` on the anchor drives this, so it works for tab switches that toggle `display` (not just scroll/resize).
- A pinned tooltip carries the `pict-modal-tooltip-pinned` class (a subtle ring distinguishes it from a transient hover tooltip) and is `pointer-events: auto`.
- All the [`richTooltip()`](richTooltip.md) notes apply: HTML is rendered via `innerHTML` (sanitize user content), auto-flip + viewport clamping, `aria-describedby` wiring, and z-index 1020.
- `destroy()` unpins, hides immediately, and removes every listener (hover, focus, click, scroll, resize).
