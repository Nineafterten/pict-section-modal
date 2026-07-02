/**
 * Pict-Modal-Tooltip
 *
 * Manages simple text and rich HTML tooltips with positioning and auto-flip.
 */
class PictModalTooltip
{
	constructor(pModal)
	{
		this._modal = pModal;
	}

	/**
	 * Attach a simple text tooltip to an element.
	 *
	 * @param {HTMLElement} pElement - Target element
	 * @param {string} pText - Tooltip text
	 * @param {object} [pOptions] - Options (position, delay, maxWidth)
	 * @returns {{ destroy: function }} Handle to remove the tooltip
	 */
	tooltip(pElement, pText, pOptions)
	{
		let tmpOptions = Object.assign({}, this._modal.options.DefaultTooltipOptions, pOptions);
		return this._attachTooltip(pElement, pText, false, tmpOptions);
	}

	/**
	 * Attach a rich HTML tooltip to an element.
	 *
	 * @param {HTMLElement} pElement - Target element
	 * @param {string} pHTMLContent - HTML content for the tooltip
	 * @param {object} [pOptions] - Options (position, delay, maxWidth, interactive)
	 * @returns {{ destroy: function }} Handle to remove the tooltip
	 */
	richTooltip(pElement, pHTMLContent, pOptions)
	{
		let tmpOptions = Object.assign({}, this._modal.options.DefaultTooltipOptions, pOptions);
		return this._attachTooltip(pElement, pHTMLContent, true, tmpOptions);
	}

	/**
	 * Attach a pinnable rich HTML tooltip to an element.
	 *
	 * Behaves like richTooltip() on hover/focus, but a click on the element
	 * toggles a pinned state: while pinned the tooltip stays open (it does not
	 * hide on mouseleave/focusout) and follows its anchor on scroll/resize.
	 * This is opt-in sugar over richTooltip() with `{ pinnable: true }` — the
	 * default tooltip()/richTooltip() behavior is unchanged.
	 *
	 * @param {HTMLElement} pElement - Target element
	 * @param {string} pHTMLContent - HTML content for the tooltip
	 * @param {object} [pOptions] - Options (position, delay, maxWidth, interactive, startPinned, onPinChange)
	 * @returns {{ destroy: function, pin: function, unpin: function, isPinned: function }} Handle
	 */
	pinnableTooltip(pElement, pHTMLContent, pOptions)
	{
		let tmpOptions = Object.assign({}, this._modal.options.DefaultTooltipOptions, pOptions, { pinnable: true });
		return this._attachTooltip(pElement, pHTMLContent, true, tmpOptions);
	}

	/**
	 * Internal: attach tooltip event listeners to an element.
	 *
	 * @param {HTMLElement} pElement
	 * @param {string} pContent
	 * @param {boolean} pIsHTML
	 * @param {object} pOptions
	 * @returns {{ destroy: function }}
	 */
	_attachTooltip(pElement, pContent, pIsHTML, pOptions)
	{
		let tmpTooltipElement = null;
		let tmpShowTimeout = null;
		let tmpHideTimeout = null;
		let tmpDestroyed = false;
		let tmpId = this._modal._nextId();

		// Pin state — only meaningful when pOptions.pinnable is set. A pinned
		// tooltip stays visible (transient hide is suppressed) and follows its
		// anchor on scroll/resize.
		let tmpPinned = false;

		let tmpShow = () =>
		{
			if (tmpDestroyed || tmpTooltipElement)
			{
				return;
			}

			tmpTooltipElement = document.createElement('div');
			tmpTooltipElement.className = 'pict-modal-tooltip pict-modal-tooltip--' + pOptions.position;
			tmpTooltipElement.id = 'pict-modal-tooltip-' + tmpId;
			tmpTooltipElement.setAttribute('role', 'tooltip');
			tmpTooltipElement.style.maxWidth = pOptions.maxWidth;

			if (pOptions.interactive)
			{
				tmpTooltipElement.classList.add('pict-modal-tooltip-interactive');
			}

			// Optional consumer-supplied class(es) on the tooltip element, e.g.
			// to theme the bubble + arrow by overriding the --pict-modal-tooltip-*
			// custom properties for a specific tooltip.
			if (pOptions.className)
			{
				let tmpExtraClasses = String(pOptions.className).split(/\s+/);
				for (let i = 0; i < tmpExtraClasses.length; i++)
				{
					if (tmpExtraClasses[i])
					{
						tmpTooltipElement.classList.add(tmpExtraClasses[i]);
					}
				}
			}

			// Arrow
			let tmpArrow = document.createElement('div');
			tmpArrow.className = 'pict-modal-tooltip-arrow';

			// Content
			let tmpContentDiv = document.createElement('div');
			if (pIsHTML)
			{
				tmpContentDiv.innerHTML = pContent;
			}
			else
			{
				tmpContentDiv.textContent = pContent;
			}

			tmpTooltipElement.appendChild(tmpArrow);
			tmpTooltipElement.appendChild(tmpContentDiv);
			document.body.appendChild(tmpTooltipElement);

			// Set aria-describedby on target
			pElement.setAttribute('aria-describedby', tmpTooltipElement.id);

			// Position
			this._positionTooltip(tmpTooltipElement, pElement, pOptions.position);

			// Animate in — but only paint when the anchor is actually rendered.
			// A pinned / startPinned tooltip whose anchor lives in a hidden
			// container (e.g. an inactive tab panel) would otherwise show at the
			// clamped corner as an orphan. It is revealed later by tmpReposition
			// once the anchor gains a layout box (see the ResizeObserver below).
			void tmpTooltipElement.offsetHeight;
			if (this._isElementRendered(pElement))
			{
				tmpTooltipElement.classList.add('pict-modal-visible');
			}

			// Track
			this._modal._activeTooltips.push(
			{
				element: tmpTooltipElement,
				targetElement: pElement,
				destroy: tmpDestroy
			});

			// For interactive tooltips, allow hovering over the tooltip itself
			if (pOptions.interactive && tmpTooltipElement)
			{
				tmpTooltipElement.addEventListener('mouseenter', () =>
				{
					if (tmpHideTimeout)
					{
						clearTimeout(tmpHideTimeout);
						tmpHideTimeout = null;
					}
				});
				tmpTooltipElement.addEventListener('mouseleave', () =>
				{
					if (!tmpPinned)
					{
						tmpHide();
					}
				});
			}

			// Reflect pinned state on a freshly-(re)created element.
			if (tmpPinned && tmpTooltipElement)
			{
				tmpTooltipElement.classList.add('pict-modal-tooltip-pinned');
			}
		};

		let tmpHide = () =>
		{
			if (!tmpTooltipElement)
			{
				return;
			}

			tmpTooltipElement.classList.remove('pict-modal-visible');
			let tmpEl = tmpTooltipElement;
			tmpTooltipElement = null;

			// Remove aria
			pElement.removeAttribute('aria-describedby');

			// Remove from tracking
			this._modal._activeTooltips = this._modal._activeTooltips.filter(
				(pEntry) => { return pEntry.element !== tmpEl; }
			);

			setTimeout(() =>
			{
				if (tmpEl.parentNode)
				{
					tmpEl.parentNode.removeChild(tmpEl);
				}
			}, 220);
		};

		let tmpOnMouseEnter = () =>
		{
			if (tmpHideTimeout)
			{
				clearTimeout(tmpHideTimeout);
				tmpHideTimeout = null;
			}
			tmpShowTimeout = setTimeout(tmpShow, pOptions.delay);
		};

		let tmpOnMouseLeave = () =>
		{
			if (tmpShowTimeout)
			{
				clearTimeout(tmpShowTimeout);
				tmpShowTimeout = null;
			}
			// A pinned tooltip stays open regardless of pointer.
			if (tmpPinned)
			{
				return;
			}
			// Small delay before hiding to allow moving to interactive tooltip
			if (pOptions.interactive)
			{
				tmpHideTimeout = setTimeout(tmpHide, 100);
			}
			else
			{
				tmpHide();
			}
		};

		let tmpOnFocusIn = () =>
		{
			tmpShowTimeout = setTimeout(tmpShow, pOptions.delay);
		};

		let tmpOnFocusOut = () =>
		{
			if (tmpShowTimeout)
			{
				clearTimeout(tmpShowTimeout);
				tmpShowTimeout = null;
			}
			// A pinned tooltip stays open regardless of focus.
			if (tmpPinned)
			{
				return;
			}
			tmpHide();
		};

		// -- Pin lifecycle (opt-in via pOptions.pinnable) --

		// Keep a pinned tooltip glued to its anchor as the page scrolls/resizes.
		// The element is position:fixed and portaled to <body>, so it does not
		// move with the document on its own. When the anchor scrolls out of the
		// viewport we fade the tooltip out (without dropping the pin) and bring
		// it back when the anchor returns.
		let tmpResizeObserver = null;
		let tmpReposition = () =>
		{
			if (!tmpTooltipElement)
			{
				return;
			}
			let tmpRect = pElement.getBoundingClientRect();
			// Rendered (has a layout box) AND within the viewport. A hidden anchor
			// (display:none, or inside a hidden tab panel) has no box, so the
			// tooltip is hidden rather than stranded at the clamped corner.
			let tmpInView = this._isElementRendered(pElement)
				&& (tmpRect.bottom > 0) && (tmpRect.top < window.innerHeight)
				&& (tmpRect.right > 0) && (tmpRect.left < window.innerWidth);
			if (tmpInView)
			{
				this._positionTooltip(tmpTooltipElement, pElement, pOptions.position);
				tmpTooltipElement.classList.add('pict-modal-visible');
			}
			else
			{
				tmpTooltipElement.classList.remove('pict-modal-visible');
			}
		};

		let tmpAddRepositionListeners = () =>
		{
			// `true` (capture) so scrolls inside any nested container reposition too.
			window.addEventListener('scroll', tmpReposition, true);
			window.addEventListener('resize', tmpReposition);
			// A ResizeObserver on the anchor catches it being shown/hidden (e.g. a
			// tab panel toggling display) — transitions the window scroll/resize
			// listeners miss — so a pinned tooltip appears the moment its anchor
			// gains a layout box and hides again when it loses one.
			if (typeof ResizeObserver !== 'undefined')
			{
				tmpResizeObserver = new ResizeObserver(() => tmpReposition());
				tmpResizeObserver.observe(pElement);
			}
		};

		let tmpRemoveRepositionListeners = () =>
		{
			window.removeEventListener('scroll', tmpReposition, true);
			window.removeEventListener('resize', tmpReposition);
			if (tmpResizeObserver)
			{
				tmpResizeObserver.disconnect();
				tmpResizeObserver = null;
			}
		};

		let tmpPin = () =>
		{
			if (tmpPinned || tmpDestroyed)
			{
				return;
			}
			tmpPinned = true;
			if (!tmpTooltipElement)
			{
				tmpShow();
			}
			if (tmpTooltipElement)
			{
				tmpTooltipElement.classList.add('pict-modal-tooltip-pinned');
			}
			tmpAddRepositionListeners();
			if (typeof pOptions.onPinChange === 'function')
			{
				pOptions.onPinChange(true, pElement);
			}
		};

		let tmpUnpin = () =>
		{
			if (!tmpPinned)
			{
				return;
			}
			tmpPinned = false;
			tmpRemoveRepositionListeners();
			if (tmpTooltipElement)
			{
				tmpTooltipElement.classList.remove('pict-modal-tooltip-pinned');
			}
			tmpHide();
			if (typeof pOptions.onPinChange === 'function')
			{
				pOptions.onPinChange(false, pElement);
			}
		};

		let tmpOnClick = (pEvent) =>
		{
			if (pEvent)
			{
				pEvent.preventDefault();
				pEvent.stopPropagation();
			}
			if (tmpPinned)
			{
				tmpUnpin();
			}
			else
			{
				tmpPin();
			}
		};

		// Attach listeners
		pElement.addEventListener('mouseenter', tmpOnMouseEnter);
		pElement.addEventListener('mouseleave', tmpOnMouseLeave);
		pElement.addEventListener('focusin', tmpOnFocusIn);
		pElement.addEventListener('focusout', tmpOnFocusOut);
		if (pOptions.pinnable)
		{
			pElement.addEventListener('click', tmpOnClick);
		}

		let tmpDestroy = () =>
		{
			if (tmpDestroyed)
			{
				return;
			}
			tmpDestroyed = true;

			if (tmpShowTimeout)
			{
				clearTimeout(tmpShowTimeout);
			}
			if (tmpHideTimeout)
			{
				clearTimeout(tmpHideTimeout);
			}

			tmpRemoveRepositionListeners();
			tmpPinned = false;
			tmpHide();

			pElement.removeEventListener('mouseenter', tmpOnMouseEnter);
			pElement.removeEventListener('mouseleave', tmpOnMouseLeave);
			pElement.removeEventListener('focusin', tmpOnFocusIn);
			pElement.removeEventListener('focusout', tmpOnFocusOut);
			if (pOptions.pinnable)
			{
				pElement.removeEventListener('click', tmpOnClick);
			}
		};

		// Optionally render already-pinned (explicit consumer opt-in).
		if (pOptions.pinnable && pOptions.startPinned)
		{
			tmpPin();
		}

		return {
			destroy: tmpDestroy,
			pin: tmpPin,
			unpin: tmpUnpin,
			isPinned: () => { return tmpPinned; }
		};
	}

	/**
	 * Position a tooltip element relative to the target element.
	 * Flips direction if the tooltip would overflow the viewport.
	 *
	 * @param {HTMLElement} pTooltip
	 * @param {HTMLElement} pTarget
	 * @param {string} pPosition - 'top', 'bottom', 'left', 'right'
	 */
	_positionTooltip(pTooltip, pTarget, pPosition)
	{
		let tmpTargetRect = pTarget.getBoundingClientRect();
		let tmpTooltipRect = pTooltip.getBoundingClientRect();
		let tmpGap = 8;

		let tmpPosition = pPosition;

		// Flip if needed
		if (tmpPosition === 'top' && tmpTargetRect.top < tmpTooltipRect.height + tmpGap)
		{
			tmpPosition = 'bottom';
		}
		else if (tmpPosition === 'bottom' && (window.innerHeight - tmpTargetRect.bottom) < tmpTooltipRect.height + tmpGap)
		{
			tmpPosition = 'top';
		}
		else if (tmpPosition === 'left' && tmpTargetRect.left < tmpTooltipRect.width + tmpGap)
		{
			tmpPosition = 'right';
		}
		else if (tmpPosition === 'right' && (window.innerWidth - tmpTargetRect.right) < tmpTooltipRect.width + tmpGap)
		{
			tmpPosition = 'left';
		}

		// Update class for arrow direction
		pTooltip.className = pTooltip.className.replace(/pict-modal-tooltip--\w+/, 'pict-modal-tooltip--' + tmpPosition);

		let tmpTop = 0;
		let tmpLeft = 0;

		switch (tmpPosition)
		{
			case 'top':
				tmpTop = tmpTargetRect.top - tmpTooltipRect.height - tmpGap;
				tmpLeft = tmpTargetRect.left + (tmpTargetRect.width / 2) - (tmpTooltipRect.width / 2);
				break;
			case 'bottom':
				tmpTop = tmpTargetRect.bottom + tmpGap;
				tmpLeft = tmpTargetRect.left + (tmpTargetRect.width / 2) - (tmpTooltipRect.width / 2);
				break;
			case 'left':
				tmpTop = tmpTargetRect.top + (tmpTargetRect.height / 2) - (tmpTooltipRect.height / 2);
				tmpLeft = tmpTargetRect.left - tmpTooltipRect.width - tmpGap;
				break;
			case 'right':
				tmpTop = tmpTargetRect.top + (tmpTargetRect.height / 2) - (tmpTooltipRect.height / 2);
				tmpLeft = tmpTargetRect.right + tmpGap;
				break;
		}

		// Clamp to viewport
		tmpLeft = Math.max(4, Math.min(tmpLeft, window.innerWidth - tmpTooltipRect.width - 4));
		tmpTop = Math.max(4, Math.min(tmpTop, window.innerHeight - tmpTooltipRect.height - 4));

		pTooltip.style.top = tmpTop + 'px';
		pTooltip.style.left = tmpLeft + 'px';
	}

	/**
	 * Whether an element is currently rendered (has a layout box). Returns false
	 * for a display:none element or one inside a display:none ancestor (e.g. an
	 * inactive tab panel) — in which case a pinned tooltip should stay hidden
	 * until the anchor reappears.
	 *
	 * @param {HTMLElement} pElement
	 * @returns {boolean}
	 */
	_isElementRendered(pElement)
	{
		return !!(pElement && typeof pElement.getClientRects === 'function' && pElement.getClientRects().length > 0);
	}

	/**
	 * Dismiss all active tooltips.
	 */
	dismissAll()
	{
		let tmpTooltips = this._modal._activeTooltips.slice();
		for (let i = 0; i < tmpTooltips.length; i++)
		{
			tmpTooltips[i].destroy();
		}
	}
}

module.exports = PictModalTooltip;
