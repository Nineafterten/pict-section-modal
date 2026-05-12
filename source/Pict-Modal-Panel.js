/**
 * Pict-Modal-Panel
 *
 * Adds resizable and collapsible panel behavior to any DOM element.
 * Follows the handler composition pattern used by the other modal
 * handlers (confirm, window, toast, tooltip).
 *
 * Usage:
 *   let handle = modal.panel('#my-panel', { position: 'right', width: 340 });
 *   handle.toggle();
 *   handle.destroy();
 */
class PictModalPanel
{
	constructor(pModal)
	{
		this._modal = pModal;
		this._panels = [];
	}

	/**
	 * Attach resizable/collapsible panel behavior to an element.
	 *
	 * @param {string} pTargetSelector - CSS selector for the panel element
	 * @param {object} [pOptions] - Panel options
	 * @returns {{ collapse, expand, toggle, setWidth, destroy }} Panel handle
	 */
	create(pTargetSelector, pOptions)
	{
		let tmpDefaults = (this._modal && this._modal.options && this._modal.options.DefaultPanelOptions) || {};
		let tmpOptions = Object.assign({},
			{
				position: 'right',
				width: 340,
				minWidth: 200,
				maxWidth: 600,
				collapsible: true,
				collapsed: false,
				persist: false,
				persistKey: '',
				onResize: null,
				onToggle: null
			},
			tmpDefaults,
			pOptions);

		if (typeof document === 'undefined') return this._nullHandle();

		let tmpTarget = document.querySelector(pTargetSelector);
		if (!tmpTarget) return this._nullHandle();

		let tmpId = this._modal._nextId();
		let tmpIsRight = tmpOptions.position === 'right';
		let tmpIsCollapsed = false;
		let tmpCurrentWidth = tmpOptions.width;
		let tmpDestroyed = false;

		// Restore persisted state
		if (tmpOptions.persist && tmpOptions.persistKey)
		{
			try
			{
				let tmpStored = localStorage.getItem('pict-panel-' + tmpOptions.persistKey);
				if (tmpStored)
				{
					let tmpParsed = JSON.parse(tmpStored);
					if (typeof tmpParsed.width === 'number') tmpCurrentWidth = tmpParsed.width;
					if (typeof tmpParsed.collapsed === 'boolean') tmpOptions.collapsed = tmpParsed.collapsed;
				}
			}
			catch (e) { /* ignore */ }
		}

		// Apply classes and initial width
		tmpTarget.classList.add('pict-panel');
		tmpTarget.classList.add(tmpIsRight ? 'pict-panel-right' : 'pict-panel-left');
		tmpTarget.style.width = tmpCurrentWidth + 'px';

		// Remove display:none if present — panel uses width collapse instead
		if (tmpTarget.style.display === 'none')
		{
			tmpTarget.style.display = '';
		}

		// ── Create the edge container ───────────────────────
		let tmpEdge = document.createElement('div');
		tmpEdge.className = 'pict-panel-edge ' + (tmpIsRight ? 'pict-panel-edge-right' : 'pict-panel-edge-left');

		// Resize handle
		let tmpResize = document.createElement('div');
		tmpResize.className = 'pict-panel-resize';
		tmpEdge.appendChild(tmpResize);

		// Collapse tab (chevron SVG)
		let tmpTab = null;
		if (tmpOptions.collapsible)
		{
			tmpTab = document.createElement('div');
			tmpTab.className = 'pict-panel-tab';
			tmpTab.title = 'Toggle panel';
			tmpEdge.appendChild(tmpTab);
		}

		// Insert edge as a sibling so it is not clipped by the
		// panel's own overflow (e.g. overflow-y: auto for scrolling).
		// Right panels: edge goes BEFORE the panel (left side).
		// Left panels: edge goes AFTER the panel (right side).
		if (tmpTarget.parentNode)
		{
			if (tmpIsRight)
			{
				tmpTarget.parentNode.insertBefore(tmpEdge, tmpTarget);
			}
			else
			{
				tmpTarget.parentNode.insertBefore(tmpEdge, tmpTarget.nextSibling);
			}
		}
		else
		{
			tmpTarget.insertBefore(tmpEdge, tmpTarget.firstChild);
		}

		// ── Chevron lookup via pict.providers.Icon ──────────
		// Both directions come from the core registry (`{~I:ChevronLeft~}`
		// / `{~I:ChevronRight~}`).  Resolved per-render so a theme that
		// re-registers the chevron variant picks up automatically.  Empty
		// fallback in the unlikely case pict is missing the Icon provider
		// (very old pict versions; current minimum is 1.0.368).
		let tmpPictHandle = (typeof (window) !== 'undefined' && window.pict) ? window.pict : null;
		let tmpIcon = (pName) => (tmpPictHandle && typeof (tmpPictHandle.icon) === 'function')
			? tmpPictHandle.icon(pName)
			: '';

		let tmpUpdateChevron = () =>
		{
			if (!tmpTab) return;
			let tmpChevronRight = tmpIcon('ChevronRight');
			let tmpChevronLeft  = tmpIcon('ChevronLeft');
			if (tmpIsRight)
			{
				tmpTab.innerHTML = tmpIsCollapsed ? tmpChevronLeft : tmpChevronRight;
			}
			else
			{
				tmpTab.innerHTML = tmpIsCollapsed ? tmpChevronRight : tmpChevronLeft;
			}
		};

		// ── Persist helper ──────────────────────────────────
		let tmpPersist = () =>
		{
			if (!tmpOptions.persist || !tmpOptions.persistKey) return;
			try
			{
				localStorage.setItem('pict-panel-' + tmpOptions.persistKey,
					JSON.stringify({ width: tmpCurrentWidth, collapsed: tmpIsCollapsed }));
			}
			catch (e) { /* ignore */ }
		};

		// ── Collapse / expand ───────────────────────────────
		let tmpCollapse = () =>
		{
			if (tmpIsCollapsed || tmpDestroyed) return;
			tmpIsCollapsed = true;
			tmpTarget.classList.add('pict-panel-collapsed');
			tmpEdge.classList.add('pict-panel-edge-collapsed');
			tmpUpdateChevron();
			tmpPersist();
			if (typeof tmpOptions.onToggle === 'function') tmpOptions.onToggle(true);
		};

		let tmpExpand = () =>
		{
			if (!tmpIsCollapsed || tmpDestroyed) return;
			tmpIsCollapsed = false;
			tmpEdge.classList.remove('pict-panel-edge-collapsed');
			tmpTarget.classList.remove('pict-panel-collapsed');
			tmpTarget.style.width = tmpCurrentWidth + 'px';
			tmpUpdateChevron();
			tmpPersist();
			if (typeof tmpOptions.onToggle === 'function') tmpOptions.onToggle(false);
		};

		let tmpToggle = () =>
		{
			if (tmpIsCollapsed) tmpExpand();
			else tmpCollapse();
		};

		let tmpSetWidth = (pWidth) =>
		{
			if (tmpDestroyed) return;
			let tmpWidth = Math.max(tmpOptions.minWidth, Math.min(tmpOptions.maxWidth, pWidth));
			tmpCurrentWidth = tmpWidth;
			if (!tmpIsCollapsed)
			{
				tmpTarget.style.width = tmpWidth + 'px';
			}
			tmpPersist();
			if (typeof tmpOptions.onResize === 'function') tmpOptions.onResize(tmpWidth);
		};

		// ── Tab click ───────────────────────────────────────
		if (tmpTab)
		{
			tmpTab.addEventListener('click', (pEvent) =>
			{
				pEvent.stopPropagation();
				tmpToggle();
			});
		}

		// ── Resize drag ─────────────────────────────────────
		let tmpOnMouseDown = (pEvent) =>
		{
			if (tmpIsCollapsed) return;
			pEvent.preventDefault();

			let tmpStartX = pEvent.clientX;
			let tmpStartWidth = tmpTarget.offsetWidth;

			tmpResize.classList.add('dragging');
			tmpTarget.style.transition = 'none';
			document.body.style.userSelect = 'none';
			document.body.style.cursor = 'col-resize';

			let tmpOnMouseMove = (pMoveEvent) =>
			{
				let tmpDelta = tmpIsRight
					? (tmpStartX - pMoveEvent.clientX)
					: (pMoveEvent.clientX - tmpStartX);
				let tmpNewWidth = Math.max(tmpOptions.minWidth,
					Math.min(tmpOptions.maxWidth, tmpStartWidth + tmpDelta));
				tmpTarget.style.width = tmpNewWidth + 'px';
			};

			let tmpOnMouseUp = (pUpEvent) =>
			{
				document.removeEventListener('mousemove', tmpOnMouseMove);
				document.removeEventListener('mouseup', tmpOnMouseUp);

				tmpResize.classList.remove('dragging');
				tmpTarget.style.transition = '';
				document.body.style.userSelect = '';
				document.body.style.cursor = '';

				// Capture the final width
				tmpCurrentWidth = tmpTarget.offsetWidth;
				tmpPersist();
				if (typeof tmpOptions.onResize === 'function') tmpOptions.onResize(tmpCurrentWidth);
			};

			document.addEventListener('mousemove', tmpOnMouseMove);
			document.addEventListener('mouseup', tmpOnMouseUp);
		};

		tmpResize.addEventListener('mousedown', tmpOnMouseDown);

		// ── Initial state ───────────────────────────────────
		tmpUpdateChevron();

		if (tmpOptions.collapsed)
		{
			tmpIsCollapsed = true;
			tmpTarget.classList.add('pict-panel-collapsed');
			tmpEdge.classList.add('pict-panel-edge-collapsed');
			tmpUpdateChevron();
		}

		// ── Destroy ─────────────────────────────────────────
		let tmpDestroy = () =>
		{
			if (tmpDestroyed) return;
			tmpDestroyed = true;

			tmpResize.removeEventListener('mousedown', tmpOnMouseDown);
			if (tmpEdge.parentNode) tmpEdge.remove();
			tmpTarget.classList.remove('pict-panel', 'pict-panel-right', 'pict-panel-left', 'pict-panel-collapsed');
			tmpTarget.style.width = '';
			tmpTarget.style.transition = '';

			let tmpIdx = this._panels.indexOf(tmpHandle);
			if (tmpIdx >= 0) this._panels.splice(tmpIdx, 1);
		};

		// ── Return handle ───────────────────────────────────
		let tmpHandle =
		{
			id: tmpId,
			collapse: tmpCollapse,
			expand: tmpExpand,
			toggle: tmpToggle,
			setWidth: tmpSetWidth,
			destroy: tmpDestroy
		};

		this._panels.push(tmpHandle);
		return tmpHandle;
	}

	/**
	 * Return a no-op handle for server-side or missing-element cases.
	 */
	_nullHandle()
	{
		return {
			id: 0,
			collapse: () => {},
			expand: () => {},
			toggle: () => {},
			setWidth: () => {},
			destroy: () => {}
		};
	}

	/**
	 * Destroy all active panels.
	 */
	destroyAll()
	{
		let tmpPanels = this._panels.slice();
		for (let i = 0; i < tmpPanels.length; i++)
		{
			tmpPanels[i].destroy();
		}
	}
}

module.exports = PictModalPanel;
