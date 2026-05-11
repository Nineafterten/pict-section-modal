const libPictApplication = require('pict-application');
const libPictView        = require('pict-view');

const libPictSectionModal = require('pict-section-modal');
const libPictSectionCode = require('pict-section-code');

const libPictViewModalGardenLayout = require('./views/PictView-ModalGarden-Layout.js');

// ── ShellDemo-Counter view ──────────────────────────────────────────
// A tiny inline Pict view used by the "ContentView Binding" panel
// demo. The shell binds this view to a collapsible panel via the
// `ContentView: 'ShellDemo-Counter'` option, then auto-renders it at
// creation and on every expand transition. Each render increments a
// counter so the user sees concrete evidence of the auto-render.
class ShellDemoCounterView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this._tick = 0;
	}
	onBeforeRender()
	{
		this._tick++;
		// Mutate AppData so the template picks it up — Pict resolves
		// the template Record from DefaultTemplateRecordAddress
		// BEFORE invoking onBeforeRender, so the return value here
		// would be ignored.
		this.pict.AppData.ShellDemo = this.pict.AppData.ShellDemo || {};
		this.pict.AppData.ShellDemo.Tick = this._tick;
	}
}
ShellDemoCounterView.default_configuration =
{
	ViewIdentifier:               'ShellDemo-Counter',
	DefaultRenderable:            'ShellDemo-Counter-Renderable',
	DefaultDestinationAddress:    '#ShellDemo-Counter-Slot',
	DefaultTemplateRecordAddress: 'AppData.ShellDemo',
	AutoRender:                   false,
	Templates:
	[
		{
			Hash: 'ShellDemo-Counter-Template',
			Template: '<div style="padding:14px;font-size:13px;color:#9d174d;">'
				+ '<div style="font-weight:600;margin-bottom:6px;">Auto-rendered by the shell.</div>'
				+ '<div>Render tick: <strong>{~D:Record.Tick~}</strong></div>'
				+ '</div>'
		}
	],
	Renderables:
	[
		{
			RenderableHash: 'ShellDemo-Counter-Renderable',
			TemplateHash:   'ShellDemo-Counter-Template',
			ContentDestinationAddress: '#ShellDemo-Counter-Slot',
			RenderMethod:   'replace'
		}
	]
};

// -- Code Snippet Configurations (read-only display blocks) --

const _CodeSnippets =
[
	{
		ViewIdentifier: 'CodeSnippet-Confirm',
		TargetElementAddress: '#code-snippet-confirm',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "let tmpModal = this.pict.views.PictSectionModal;\n\nlet tmpResult = await tmpModal.confirm('Are you sure you want to proceed?');\n// tmpResult === true  (confirmed)\n// tmpResult === false (cancelled)"
	},
	{
		ViewIdentifier: 'CodeSnippet-DangerousConfirm',
		TargetElementAddress: '#code-snippet-dangerous-confirm',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "let tmpResult = await tmpModal.confirm(\n\t'Delete this record? This action cannot be undone.',\n\t{ dangerous: true, title: 'Delete Record' }\n);"
	},
	{
		ViewIdentifier: 'CodeSnippet-DoubleConfirmPhrase',
		TargetElementAddress: '#code-snippet-double-confirm-phrase',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "let tmpResult = await tmpModal.doubleConfirm(\n\t'This will permanently delete all data in the system.',\n\t{ confirmPhrase: 'DELETE ALL', title: 'Permanent Deletion' }\n);"
	},
	{
		ViewIdentifier: 'CodeSnippet-DoubleConfirmTwoClick',
		TargetElementAddress: '#code-snippet-double-confirm-twoclick',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "let tmpResult = await tmpModal.doubleConfirm(\n\t'Reset all settings to their factory defaults?',\n\t{ title: 'Reset Settings' }\n);"
	},
	{
		ViewIdentifier: 'CodeSnippet-CustomModal',
		TargetElementAddress: '#code-snippet-custom-modal',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "let tmpButtonHash = await tmpModal.show({\n\ttitle: 'Edit Record',\n\tcontent: '<p>You have unsaved changes.</p>',\n\twidth: '500px',\n\tbuttons: [\n\t\t{ Hash: 'cancel', Label: 'Cancel', Style: '' },\n\t\t{ Hash: 'delete', Label: 'Delete', Style: 'danger' },\n\t\t{ Hash: 'save',   Label: 'Save Changes', Style: 'primary' }\n\t]\n});\n// tmpButtonHash === 'save' | 'delete' | 'cancel' | null"
	},
	{
		ViewIdentifier: 'CodeSnippet-ToastTypes',
		TargetElementAddress: '#code-snippet-toast-types',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "tmpModal.toast('Operation completed.', { type: 'success' });\ntmpModal.toast('Something went wrong.', { type: 'error' });\ntmpModal.toast('Please check your input.', { type: 'warning' });\ntmpModal.toast('New version available.', { type: 'info' });"
	},
	{
		ViewIdentifier: 'CodeSnippet-ToastPositions',
		TargetElementAddress: '#code-snippet-toast-positions',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "tmpModal.toast('Message here', { position: 'top-right' });\ntmpModal.toast('Message here', { position: 'bottom-center' });\n// positions: top-right, top-left, top-center,\n//            bottom-right, bottom-left, bottom-center"
	},
	{
		ViewIdentifier: 'CodeSnippet-ToastOptions',
		TargetElementAddress: '#code-snippet-toast-options',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "// Persistent toast (no auto-dismiss)\ntmpModal.toast('Stays until dismissed.', { duration: 0 });\n\n// No dismiss button (auto-closes in 3s)\ntmpModal.toast('Auto-close only.', { dismissible: false });\n\n// Dismiss all active toasts\ntmpModal.dismissToasts();"
	},
	{
		ViewIdentifier: 'CodeSnippet-Tooltips',
		TargetElementAddress: '#code-snippet-tooltips',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "let tmpElement = document.getElementById('my-element');\nlet tmpHandle = tmpModal.tooltip(tmpElement, 'Tooltip text', {\n\tposition: 'top'  // 'top' | 'bottom' | 'left' | 'right'\n});\n// tmpHandle.destroy() removes the tooltip"
	},
	{
		ViewIdentifier: 'CodeSnippet-RichTooltips',
		TargetElementAddress: '#code-snippet-rich-tooltips',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "let tmpHandle = tmpModal.richTooltip(\n\ttmpElement,\n\t'<strong>User Profile</strong><p>Jane Doe</p>',\n\t{ position: 'bottom', maxWidth: '280px', interactive: true }\n);\n// tmpHandle.destroy() removes the tooltip"
	},
	{
		ViewIdentifier: 'CodeSnippet-DropdownNav',
		TargetElementAddress: '#code-snippet-dropdown-nav',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "// Anchor a menu under a nav link\ntmpModal.dropdown(navLinkEl,\n{\n\titems:\n\t[\n\t\t{ Hash: 'app',     Label: 'Application Suite' },\n\t\t{ Hash: 'tools',   Label: 'Developer Tools' },\n\t\t{ Separator: true },\n\t\t{ Hash: 'whats-new', Label: 'What\\'s new', Hint: '5 new' }\n\t]\n}).then((pChoice) => { if (pChoice) console.log(pChoice.Hash); });"
	},
	{
		ViewIdentifier: 'CodeSnippet-DropdownSplit',
		TargetElementAddress: '#code-snippet-dropdown-split',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "// Split-button: chevron is the dropdown anchor; align right\n// keeps the menu under the addendum even on long labels.\ntmpModal.dropdown(arrowBtnEl,\n{\n\talign: 'right',\n\titems:\n\t[\n\t\t{ Header: 'Export format' },\n\t\t{ Hash: 'csv',  Label: 'CSV',  Hint: 'default' },\n\t\t{ Hash: 'json', Label: 'JSON' },\n\t\t{ Hash: 'xlsx', Label: 'Excel (XLSX)' },\n\t\t{ Separator: true },\n\t\t{ Hash: 'parquet', Label: 'Apache Parquet',\n\t\t  Disabled: true, Tooltip: 'Pro plan only' }\n\t]\n});"
	},

	// ── Shell + Panels playground ──────────────────────────────────
	{
		ViewIdentifier: 'CodeSnippet-Shell-Anatomy',
		TargetElementAddress: '#code-snippet-shell-anatomy',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "// A shell owns a viewport — call it once with a container el.\nlet tmpShell = tmpModal.shell(viewportEl, {\n\tPersistenceKey: null   // null = don't persist, or 'my-app' to scope\n});\n\n// Each addPanel() call docks a panel to one of the four sides.\ntmpShell.addPanel({ Hash: 'top',    Side: 'top',    Mode: 'fixed', Size: 36 });\ntmpShell.addPanel({ Hash: 'bottom', Side: 'bottom', Mode: 'fixed', Size: 32 });\ntmpShell.addPanel({ Hash: 'left',   Side: 'left',   Mode: 'fixed', Size: 100 });\ntmpShell.addPanel({ Hash: 'right',  Side: 'right',  Mode: 'fixed', Size: 80 });\n\n// Center fills the remaining space — write into it directly.\ntmpShell.getCenterEl().innerHTML = '<p>Workspace</p>';"
	},
	{
		ViewIdentifier: 'CodeSnippet-Shell-Modes',
		TargetElementAddress: '#code-snippet-shell-modes',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "// fixed — no user interaction (e.g. topbar / statusbar)\ntmpShell.addPanel({\n\tHash: 'top',  Side: 'top',  Mode: 'fixed', Size: 36\n});\n\n// collapsible — user can toggle via the inner-edge collapse tab\ntmpShell.addPanel({\n\tHash: 'left', Side: 'left', Mode: 'collapsible',\n\tSize: 110, Title: 'Filters'\n});\n\n// resizable — user can both toggle AND drag the inner edge to resize\ntmpShell.addPanel({\n\tHash: 'bottom', Side: 'bottom', Mode: 'resizable',\n\tSize: 52, MinSize: 28, MaxSize: 120,\n\tTitle: 'Drag me'\n});"
	},
	{
		ViewIdentifier: 'CodeSnippet-Shell-ContentView',
		TargetElementAddress: '#code-snippet-shell-contentview',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "// 1. Register a Pict view normally:\npict.addView('MyApp-Sidebar', MyAppSidebarView.default_configuration, MyAppSidebarView);\n\n// 2. Bind it via ContentView when adding the panel — the shell\n//    auto-renders the view into the destination at creation and on\n//    every expand transition. Zero manual render() bookkeeping.\ntmpShell.addPanel({\n\tHash: 'sidebar', Side: 'left', Mode: 'collapsible',\n\tSize: 240, Title: 'Modules',\n\tContentDestinationId: 'MyApp-Sidebar-Slot',  // becomes <div id=...>\n\tContentView:          'MyApp-Sidebar'         // view to auto-render\n});"
	},
	{
		ViewIdentifier: 'CodeSnippet-Shell-Hooks',
		TargetElementAddress: '#code-snippet-shell-hooks',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "tmpShell.addPanel({\n\tHash: 'sidebar', Side: 'left', Mode: 'collapsible',\n\tSize: 140, Title: 'Hook me',\n\n\t// Fires when the panel transitions from collapsed to expanded.\n\t// Receives the panel handle so you can read state.\n\tOnExpand:   (pPanel) => fetchLatestData(),\n\n\t// Fires when the panel transitions from expanded to collapsed.\n\tOnCollapse: (pPanel) => saveDirtyState(),\n\n\t// Always fires — both directions. Receives the new collapsed value.\n\tOnToggle:   (pCollapsed) => updateAriaLive(pCollapsed)\n});"
	},
	{
		ViewIdentifier: 'CodeSnippet-Shell-Persist',
		TargetElementAddress: '#code-snippet-shell-persist',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "// PersistenceKey at the shell level is the localStorage scope.\nlet tmpShell = tmpModal.shell(viewportEl,\n{\n\tPersistenceKey: 'my-app:layout'\n});\n\n// Persist defaults to true. Set it to false to opt a single panel\n// out of persistence (e.g. a transient debug panel).\ntmpShell.addPanel({\n\tHash:    'sidebar',\n\tSide:    'left',\n\tMode:    'resizable',\n\tSize:    160,    // initial size — saved state overrides this on load\n\tPersist: true    // (default — set false to skip)\n});"
	},
	{
		ViewIdentifier: 'CodeSnippet-Shell-Overlay',
		TargetElementAddress: '#code-snippet-shell-overlay',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "// Position: 'overlay' renders the panel into the shell's overlay\n// layer (absolute positioning + box-shadow) instead of docking it\n// in a side stack. Center never gets pinched.\ntmpShell.addPanel({\n\tHash:     'sidebar',\n\tSide:     'left',         // controls which edge the overlay attaches to\n\tMode:     'collapsible',\n\tPosition: 'overlay',\n\tSize:     160,\n\tTitle:    'Overlay'\n});"
	},
	{
		ViewIdentifier: 'CodeSnippet-Shell-Drawer',
		TargetElementAddress: '#code-snippet-shell-drawer',
		Language: 'javascript',
		ReadOnly: true,
		LineNumbers: false,
		DefaultCode: "// Below `ResponsiveDrawer` px viewport width, the side panel flips\n// into a top drawer — workspace gets full width, the user opens the\n// drawer via the handle pill that hangs from its bottom.\ntmpShell.addPanel({\n\tHash:             'sidebar',\n\tSide:             'left',\n\tMode:             'resizable',\n\tSize:             170,\n\tTitle:            'Filter',\n\tResponsiveDrawer: 1100,    // viewport-width breakpoint (px); 0 disables\n\tDrawerHeight:     '33%'    // CSS height when in drawer mode (default '33vh')\n});"
	}
];

class PictApplicationModalGarden extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.pict.addView('PictSectionModal', libPictSectionModal.default_configuration, libPictSectionModal);
		this.pict.addView('ModalGardenLayout', libPictViewModalGardenLayout.default_configuration, libPictViewModalGardenLayout);

		// Demo view bound by the "ContentView Binding" shell card —
		// the shell will auto-render this view into the panel's
		// destination at creation and on every expand transition.
		this.pict.addView('ShellDemo-Counter', ShellDemoCounterView.default_configuration, ShellDemoCounterView);

		// Register all code snippet views
		for (let i = 0; i < _CodeSnippets.length; i++)
		{
			this.pict.addView(_CodeSnippets[i].ViewIdentifier, _CodeSnippets[i], libPictSectionCode);
		}
	}

	onAfterInitializeAsync(fCallback)
	{
		this.pict.views.ModalGardenLayout.render();

		return super.onAfterInitializeAsync(fCallback);
	}
}

module.exports = PictApplicationModalGarden;

module.exports.default_configuration =
{
	Name: 'ModalGardenExample',
	Hash: 'ModalGardenExample'
};
