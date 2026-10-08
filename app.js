(function () {
  var React = window.React;
  var h = React.createElement;
  var DS = window.PiwikproUiComponents;
  var noop = function () {};

  // v3 follows the light mockups; ?theme=dark brings back the dark look of v1/v2.
  localStorage.setItem('pp_theme', new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light');

  if (DS.ConfigBuilder) {
    var i18nConfig = new DS.ConfigBuilder();
    i18nConfig.withResources({
      en: {
        components: {
          'SegmentPicker.manage-segments': 'Create segment',
        },
      },
    });
    i18nConfig.build('');
  }

  var Root = DS.Root,
    Stack = DS.Stack,
    Card = DS.Card,
    Title = DS.Title,
    Button = DS.Button,
    ButtonGroup = DS.ButtonGroup,
    Badge = DS.Badge,
    Icon = DS.Icon,
    Logo = DS.Logo,
    Checkbox = DS.Checkbox,
    TextField = DS.TextField,
    Select = DS.Select,
    Tabs = DS.Tabs,
    DataTable = DS.DataTable,
    Chart = DS.Chart,
    MenuSidebar = DS.MenuSidebar,
    AppMenu = DS.AppMenu,
    SegmentPicker = DS.SegmentPicker,
    WebsitePicker = DS.WebsitePicker,
    Breadcrumb = DS.Breadcrumb,
    Text = DS.Text,
    Link = DS.Link,
    ModalView = DS.ModalView,
    OverlayView = DS.OverlayView,
    View = DS.View,
    TiledSelection = DS.TiledSelection,
    DraggableDataBlock = DS.DraggableDataBlock,
    DataBlockDropzone = DS.DataBlockDropzone,
    RadioButtonGroup = DS.RadioButtonGroup,
    ProgressBar = DS.ProgressBar,
    TextArea = DS.TextArea,
    SegmentedSelection = DS.SegmentedSelection,
    Label = DS.Label,
    Popover = DS.Popover,
    ActionList = DS.ActionList,
    Accordion = DS.Accordion;

  // ---------------------------------------------------------------------
  // Router link mocks (no real router in this static screen)
  // ---------------------------------------------------------------------
  function TopNavLink(props) {
    var isActive = props.to === 'reports';
    var cls = props.className + (isActive ? ' ' + props.activeClassName : '');
    return h('a', { href: '#', className: cls, onClick: function (e) { e.preventDefault(); } }, props.children);
  }

  function SidebarLink(props) {
    var active = props.isActive && props.isActive();
    var cls = (props.className || '') + (active ? ' ' + props.activeClassName : '');
    var isRoute = typeof props.to === 'string' && props.to.indexOf('.html') !== -1;
    return h('a', {
      href: isRoute ? props.to : '#',
      className: cls,
      onClick: isRoute ? undefined : function (e) { e.preventDefault(); },
    }, props.children);
  }

  // ---------------------------------------------------------------------
  // Top-most app bar: logo + hamburger + product name + site picker
  // ---------------------------------------------------------------------
  var WEBSITES = [
    { id: 'demo-site', type: 'ppms/app', attributes: { name: 'Demo site' } },
  ];

  function TopBar() {
    var state = React.useState(WEBSITES[0]);
    var selectedSite = state[0], setSelectedSite = state[1];
    return h('div', { className: 'top-bar' },
      h('div', { className: 'top-bar__left' },
        h(Icon, { name: 'menu', size: 'default', color: 'black' }),
        h('div', { className: 'top-bar__logo' }, h(Logo, {})),
        h(Text, { size: 16, weight: 600 }, 'Analytics')
      ),
      h('div', { className: 'top-bar__right' },
        h(WebsitePicker, {
          websites: WEBSITES,
          selected: selectedSite,
          onWebsiteSelected: setSelectedSite,
        })
      )
    );
  }

  // ---------------------------------------------------------------------
  // Second row: main app navigation tabs
  // ---------------------------------------------------------------------
  function AppNav() {
    var tabs = [
      { id: 1, label: 'Dashboards', value: 'dashboards' },
      { id: 2, label: 'Real-time dashboards', value: 'realtime' },
      { id: 3, label: 'Reports', value: 'reports' },
      { id: 4, label: 'Custom reports', value: 'custom-reports' },
      { id: 5, label: 'Goals', value: 'goals' },
      { id: 6, label: 'Ecommerce', value: 'ecommerce' },
      { id: 7, label: 'Integrations', value: 'integrations' },
      { id: 8, label: 'Settings', value: 'settings' },
    ];
    return h(AppMenu, { tabs: tabs, RouterLink: TopNavLink });
  }

  // ---------------------------------------------------------------------
  // Third row: sampling rate + segment picker
  // ---------------------------------------------------------------------
  // Kept empty of presets on purpose: this list seeds the segment picker, and for
  // a moderated usability test participants must build every segment themselves
  // rather than pick one that already gives away its name/conditions. The preset
  // definitions still live in SEGMENT_PRESETS below (and stay wired to their
  // 'value's) — restore any entry here to bring it back into the picker.
  var CONTEXT_BAR_SEGMENTS = [
    // Every entry here needs a matching SEGMENT_PRESETS definition — that is what
    // the SQL builder turns into a query. Segments built in the editor are appended
    // to this list at runtime (see segmentItems).
    { name: 'All visitors', value: 'all-visitors' },
  ];

  // Real DS.SegmentPicker (bundle: SegmentPicker2 = withSelected(SegmentPicker))
  // manages its own two-slot "selected" state internally, natively supporting
  // comparison mode (+ / x icons per slot) — no hand-rolled reconstruction
  // needed. Its built-in "info" icon (bundle: SegmentButton.jsx) appears
  // automatically next to any selected segment that differs from items[0]
  // (the default "All visitors"); we wire that onInfo callback to open our
  // full-screen segment editor.
  //
  // The real dropdown list (bundle: ActionList.jsx) has no generic per-row
  // action slot — the only per-row hook besides selecting the item is the
  // hardcoded favorite-star affordance (favoriteOnClick), normally meant for
  // "favorite this segment". Per explicit product decision, we repurpose that
  // star icon as the per-row edit trigger instead of adding a favorites
  // feature — it opens the same full-screen editor as the info icon. Note
  // this means the icon still looks like a star, not a pencil.
  function ContextBar(props) {
    function handleEditSegment(segment) {
      // The real DS Popover (Floating UI's useDismiss) auto-closes on
      // onItemSelected/onClick — see SegmentButton's childToggle in
      // _ds_bundle.js — but favoriteOnClick (our repurposed edit trigger)
      // isn't in that map, so the dropdown stays open behind the editor
      // overlay unless we dismiss it ourselves. useDismiss also listens for
      // Escape on the document, so a synthetic Escape keydown closes it.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
      if (props.onEditSegment) props.onEditSegment(segment);
    }

    return h('div', { className: 'context-bar' },
      h(Button, {
        appearance: 'subdued',
        icon: 'sampling',
        iconRight: 'chevron-down',
        text: '100% (default)',
        textAlign: 'left',
      }),
      h('div', { className: 'context-bar__segment' },
        h(SegmentPicker, {
          key: 'segment-picker-' + props.pickerVersion,
          // `selected` only seeds SegmentPicker2's (withSelected HOC) internal
          // state once, on mount — it isn't a fully controlled prop. Real
          // two-way sync happens through `onItemSelected`, which the HOC calls
          // with the new [slotA, slotB] array on every pick/remove (including
          // filling the second "+" slot, which is how native compare mode is
          // entered). We forward that straight into App's segmentSelection
          // state so the rest of the report can react to compare mode.
          selected: props.selectedSegments || [CONTEXT_BAR_SEGMENTS[0], undefined],
          items: props.segmentItems || CONTEXT_BAR_SEGMENTS,
          canManage: true,
          onManage: props.onManageSegments || noop,
          onToggle: noop,
          onItemSelected: props.onSelectedSegmentsChange || noop,
          onInfo: handleEditSegment,
          favoriteOnClick: handleEditSegment,
          dataId: 'ContextBar.SegmentPicker',
        })
      ),
      h('div', { className: 'context-bar__spacer' }),
      h(Button, { appearance: 'default', icon: 'calendar', text: 'Jan 1, 2021 – Mar 30, 2021' }),
      h(Link, {}, 'Notes')
    );
  }

  // ---------------------------------------------------------------------
  // Left sidebar navigation
  // ---------------------------------------------------------------------
  function link(text, icon, navigationPath, isActive) {
    return { text: text, icon: icon, navigationPath: navigationPath, isActive: isActive };
  }

  var sidebarData = [
    {
      section: 'Audience',
      links: [
        link('Audience overview', 'audience', 'audience-overview'),
        link('Session log', 'session-log', 'session-log'),
        link('Devices & software', 'devices', 'devices'),
        link('Locations', 'locations', 'locations'),
        link('Engagement', 'engagement', 'engagement'),
        link('Custom dimensions', 'box', 'custom-dimensions'),
        link('Custom variables', 'variable-circle', 'custom-variables'),
        link('Consent', 'checkmark-circle', 'consent'),
      ],
    },
    {
      section: 'Acquisition',
      links: [
        link('Channels', 'channels', 'index.html', function () { return true; }),
        link('Search engines', 'cm-search', 'search-engines'),
        link('Websites & social', 'cursor', 'websites-social'),
        link('Campaigns', 'campaigns', 'campaigns'),
        link('Google Search Console', 'gsc', 'google-search-console'),
        link('Google Ads', 'google-ads', 'google-ads'),
      ],
    },
    {
      section: 'Behavior',
      links: [
        link('Pages', 'pages', '../pages-report/index.html'),
        link('Internal search', 'search', 'internal-search'),
        link('Outlinks', 'external-link', 'outlinks'),
        link('Downloads', 'download', 'downloads'),
        link('Custom events', 'flag', 'custom-events'),
        link('Content performance', 'papers-outline', 'content-performance'),
      ],
    },
  ];

  function Sidebar() {
    var state = React.useState('');
    var search = state[0], setSearch = state[1];
    return h('div', { className: 'sidebar' },
      h(MenuSidebar, {
        routerLink: SidebarLink,
        listData: sidebarData,
        withAccordion: true,
        accordionOnClick: noop,
        withSearch: true,
        search: search,
        onSearchChange: function (e) { setSearch(e.target.value); },
      })
    );
  }

  // ---------------------------------------------------------------------
  // Chart legend + chart
  // ---------------------------------------------------------------------
  var METRICS = [
    { id: 'sessions', name: 'Sessions', color: 'cyan', checked: true, axisY: 'left' },
    { id: 'customEvents', name: 'Custom events', color: 'orange', checked: true, axisY: 'left' },
    { id: 'goalConversions', name: 'Goal conversions', color: null, checked: false, axisY: 'left' },
    { id: 'goalConversionRate', name: 'Goal conversion rate', color: 'violet', checked: true, axisY: 'right' },
  ];

  // ---------------------------------------------------------------------
  // Live report data — every number on the page is a ClickHouse query against
  // the local container from local-ch/ (see ../run.sh). The old hardcoded
  // REAL_TABLE_DATA / REAL_CHART_DATA blocks are gone; the SQL built here is
  // the same shape as makiety_pod_advenced_segmentation/*.sql, just assembled
  // from a segment definition instead of written out by hand.
  // ---------------------------------------------------------------------
  var CH = {
    override: new URLSearchParams(window.location.search).get('ch'),
    database: 'analyticsdemodata',
    appUuid: '9b9aaee0-bcc2-49b1-95a5-9584cbd8e3d8',
    dateFrom: '2021-01-01',
    dateTo: '2021-03-31',
  };

  // Two ways in. Opened straight off disk, the page talks to the container's
  // ClickHouse port. Served by the nginx container (which is what the tunnel
  // exposes), it posts to a same-origin /ch that pins the database, the format and
  // a read-only user server-side — the query string here would be ignored anyway.
  function chEndpoint() {
    if (CH.override) return withDirectParams(CH.override);
    if (window.location.protocol === 'file:') return withDirectParams('http://localhost:8123/');
    return new URL('ch', window.location.href).href;
  }

  function withDirectParams(base) {
    return base.replace(/\/?$/, '/') + '?' + new URLSearchParams({
      database: CH.database,
      default_format: 'JSON',
      // A file:// page has Origin "null", so every response needs an explicit
      // CORS header. Sent as a setting, so the container needs no extra config.
      add_http_cors_header: '1',
    }).toString();
  }

  function chQuery(sql) {
    // Static copy: there is no ClickHouse behind it (the reports ran on a local database).
    if (window.PP_STATIC) return Promise.reject(new Error('report data is not part of this static copy.'));
    var url = chEndpoint();
    // A plain string body keeps Content-Type at text/plain, which is a
    // CORS-safelisted value — anything else would trigger a preflight that
    // ClickHouse answers, but that file:// origins handle inconsistently.
    return fetch(url, { method: 'POST', body: sql }).then(function (response) {
      return response.text().then(function (text) {
        if (!response.ok) throw new Error(text.split('\n')[0] || ('HTTP ' + response.status));
        return JSON.parse(text);
      });
    });
  }

  // ---------------------------------------------------------------------
  // Segment definition -> SQL
  // ---------------------------------------------------------------------
  // A segment is the object shape the editor already produces (see
  // SEGMENT_PRESETS): { scope, sessionAttrGroups, eventClusters, eventScopeGroups },
  // where a cluster is { mode: 'include'|'exclude', groups: [[row, row], [row]] }
  // meaning OR of AND-groups.
  var GOAL_UUIDS = {
    'Consumer Loan Calculator': 'c795f1f3-9549-48a2-bfdd-d893f9c3f829',
    'Mortgage Loan Calculator': '5e93d96f-9f08-4ae2-b21d-f4d5fbbecd59',
    'Car Loan Calculator': 'a86bb03a-3601-4195-89af-3ac591f47b59',
    'Loan Calculator': '0130c1ee-f1de-4a29-8a42-7e3595f1946f',
    'Loan form existing customer': '6979a7d0-e49b-4532-a99d-7b0be7dec3b1',
    'Loan form new customer': 'a5ece0a3-478e-412d-8baf-2a6e2be9b801',
    'Consumer Loan Form': '13021a60-bd69-48d0-93b8-5ec11f2dd79b',
    'Car Loan Form': 'd4f2500f-f184-41a7-8976-c0655389168f',
    'Mortgage Loan Form': 'f0728a57-e216-464a-84b7-0e6cf38a4a59',
    'Contact form': '1d3b2f11-0681-4354-a795-5558bf988cde',
    'Transfer sent': 'b1623db4-1161-4e11-a8b8-06d38654da54',
    'Add new recipient': '4b9a3514-2a62-4fe4-bed1-74bd1f9e6467',
    'Delete recipient': '56fb28d1-f87e-4220-8aa7-01ee0bb8ed9c',
    'Activate your debit card': '7b1da622-f515-45a4-8e6e-65e91127d4e8',
    'Lead form': 'fa621169-2c93-4452-ad78-8db3126ab9e8',
  };

  var DEVICE_TYPES = {
    'Desktop': 0, 'Smartphone': 1, 'Tablet': 2, 'Feature phone': 3, 'Console': 4,
    'TV': 5, 'Car browser': 6, 'Smart display': 7, 'Camera': 8,
    'Portable media player': 9, 'Phablet': 10, 'Smart speaker': 11,
    'Wearable': 12, 'Peripheral': 13,
  };

  var EVENT_TYPES = {
    'Page view': 1, 'Outlink': 2, 'Download': 3, 'Internal search': 4,
    'Custom event': 5, 'Goal conversion': 8, 'Content impression': 12,
    'Content interaction': 13,
  };

  // Dimensions the SQL builder knows how to express. Anything the editor lets
  // you pick that isn't here throws, so an unsupported segment shows an error
  // instead of quietly reporting the wrong rows.
  var SEGMENT_COLUMNS = {
    'Custom event category': { column: 'custom_event_category', kind: 'string' },
    'Custom event action': { column: 'custom_event_action', kind: 'string' },
    'Custom event name': { column: 'custom_event_name', kind: 'string' },
    'Custom event value': { column: 'custom_event_value', kind: 'number' },
    'Page URL': { column: 'event_url', kind: 'string' },
    'Page title': { column: 'event_title', kind: 'string' },
    'Session entry URL': { column: 'session_entry_url', kind: 'string' },
    'Source / medium': { column: 'source_medium', kind: 'string' },
    'Country': { column: 'location_country_name', kind: 'string' },
    'Goal revenue': { column: 'goal_revenue', kind: 'number' },
    'Goal conversions in session': { column: 'session_total_goal_conversions', kind: 'number' },
    'Events in session': { column: 'session_total_events', kind: 'number' },
    'Goal name': { column: 'goal_uuid', kind: 'goal' },
    'Device type': { column: 'device_type', kind: 'enum', values: DEVICE_TYPES },
    'Event type': { column: 'event_type', kind: 'enum', values: EVENT_TYPES },
  };

  function sqlLiteral(value) {
    return "'" + String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }

  function regexLiteral(value, anchorStart, anchorEnd) {
    var escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return sqlLiteral('(?i)' + (anchorStart ? '^' : '') + escaped + (anchorEnd ? '$' : ''));
  }

  function conditionSql(alias, row) {
    var spec = SEGMENT_COLUMNS[row.dim];
    if (!spec) throw new Error('Segment dimension not wired to SQL yet: ' + row.dim);
    var column = alias + '.' + spec.column;
    var negated = row.op === 'is not' || row.op === 'does not contain';
    var sql;

    if (spec.kind === 'goal') {
      var uuid = GOAL_UUIDS[row.val];
      if (!uuid) throw new Error('Unknown goal: ' + row.val);
      sql = '(' + alias + ".event_type = 8 AND " + column + " = UUIDStringToNum('" + uuid + "'))";
    } else if (spec.kind === 'enum') {
      var code = spec.values[row.val];
      if (code === undefined) throw new Error('Unknown ' + row.dim + ': ' + row.val);
      sql = column + ' = ' + code;
    } else if (spec.kind === 'number' && (row.op === 'is' || row.op === 'is not')) {
      if (isNaN(Number(row.val))) throw new Error(row.dim + ' needs a number, got: ' + row.val);
      sql = column + ' = ' + Number(row.val);
    } else if (spec.kind === 'number') {
      // contains/starts with/ends with on a number: match its printed form, so every
      // operator in the editor does something instead of erroring.
      column = 'toString(' + column + ')';
      sql = 'match(' + column + ', ' + regexLiteral(
        row.val, row.op === 'starts with', row.op === 'ends with') + ')';
    } else if (row.op === 'contains' || row.op === 'does not contain') {
      sql = 'match(' + column + ', ' + regexLiteral(row.val, false, false) + ')';
    } else if (row.op === 'starts with') {
      sql = 'match(' + column + ', ' + regexLiteral(row.val, true, false) + ')';
    } else if (row.op === 'ends with') {
      sql = 'match(' + column + ', ' + regexLiteral(row.val, false, true) + ')';
    } else {
      sql = 'match(' + column + ', ' + regexLiteral(row.val, true, true) + ')';
    }
    // Several of these columns are Nullable; without ifNull a NULL would make the
    // whole condition NULL, so "is not X" would drop rows that plainly aren't X.
    return negated ? 'NOT ifNull(' + sql + ', 0)' : sql;
  }

  // OR of AND-groups, e.g. Play&&Video A or Play&&Video C. Shared by event
  // clusters and session-attribute groups — same OR-of-AND shape either way.
  function groupsSql(alias, groups) {
    var nonEmpty = (groups || []).filter(function (group) { return group && group.length; });
    if (!nonEmpty.length) return null;
    var parts = nonEmpty.map(function (group) {
      return group.map(function (row) { return conditionSql(alias, row); }).join(' AND ');
    });
    return parts.length === 1 ? parts[0] : '(' + parts.join(' OR ') + ')';
  }

  function clusterSql(alias, cluster) {
    return groupsSql(alias, cluster.groups);
  }

  function scopeSql(alias) {
    return [
      alias + ".app_uuid = UUIDStringToNum('" + CH.appUuid + "')",
      alias + ".server_date >= '" + CH.dateFrom + "'",
      "toDateTime(" + alias + ".server_time, 'UTC') >= '" + CH.dateFrom + " 00:00:00'",
      alias + ".server_date <= '" + CH.dateTo + "'",
      "toDateTime(" + alias + ".server_time, 'UTC') < '" + CH.dateTo + " 00:00:00'",
    ].join('\n    AND ');
  }

  // Sessions matching every include cluster (and every session attribute) at
  // once — the same `session_id GLOBAL IN (... HAVING max(...) AND max(...))`
  // shape the handwritten use-case SQL uses.
  function sessionSubquery(havingParts) {
    return 'SELECT segment_events.session_id\n' +
      '        FROM events AS segment_events\n' +
      '        WHERE ' + scopeSql('segment_events').replace(/\n    /g, '\n            ') + '\n' +
      '        GROUP BY segment_events.session_id\n' +
      '        HAVING ' + havingParts.join('\n            AND ');
  }

  // Returns the WHERE fragments a segment adds to the outer report query.
  function segmentPredicates(segment) {
    if (!segment) return [];
    var predicates = [];

    if (segment.scope === 'event' && segment.eventScopeBoxes) {
      // Event scope, box layout: every box is an OR of its rows (Exclude negates
      // that OR), and the boxes are AND'd — the reverse of the session card.
      segment.eventScopeBoxes.forEach(function (box) {
        var boxSql = groupsSql('events', box.groups);
        if (boxSql) predicates.push(box.mode === 'exclude' ? 'NOT ifNull(' + boxSql + ', 0)' : boxSql);
      });
      return predicates;
    }

    if (segment.scope === 'event') {
      // Same OR-of-AND shape as sessionAttrGroups below — groups are OR'd, rows
      // within a group AND'd, and Exclude negates the combined expression as a
      // whole (NOT(X AND Y), not NOT X AND NOT Y).
      var eventScopeSql = groupsSql('events', segment.eventScopeGroups);
      if (eventScopeSql) {
        predicates.push(segment.eventScopeMode === 'exclude' ? 'NOT ifNull(' + eventScopeSql + ', 0)' : eventScopeSql);
      }
      return predicates;
    }

    // Session attributes are session-level columns denormalised onto every event, so
    // they filter the reported rows straight from the outer WHERE — the same place an
    // event-scope segment puts its conditions. Only the "an event in the session
    // where…" blocks need the session_id subquery. Groups are OR'd, rows within a
    // group AND'd (same shape as event clusters) — Exclude negates the combined
    // OR-of-AND expression as a whole, not each row independently, so "exclude X
    // AND Y" correctly means NOT(X AND Y) rather than NOT X AND NOT Y.
    var sessionAttrSql = groupsSql('events', segment.sessionAttrGroups);
    if (sessionAttrSql) {
      predicates.push(segment.sessionAttrMode === 'exclude' ? 'NOT ifNull(' + sessionAttrSql + ', 0)' : sessionAttrSql);
    }

    var includeHaving = [];
    var excludes = [];
    (segment.eventClusters || []).forEach(function (cluster) {
      var sql = clusterSql('segment_events', cluster);
      if (!sql) return;
      if (cluster.mode === 'exclude') {
        // Its own NOT IN subquery: "no event in the session matched", which is
        // not the same as "some event failed to match".
        excludes.push('events.session_id GLOBAL NOT IN (\n        ' +
          sessionSubquery(['max(' + sql + ')']) + '\n    )');
      } else {
        includeHaving.push('max(' + sql + ')');
      }
    });

    if (includeHaving.length) {
      predicates.push('events.session_id GLOBAL IN (\n        ' +
        sessionSubquery(includeHaving) + '\n    )');
    }
    return predicates.concat(excludes);
  }

  var TABLE_SELECT = "CASE events.referrer_type WHEN 1 THEN 'Direct entry' WHEN 2 THEN 'Search engine' " +
    "WHEN 3 THEN 'Website' WHEN 6 THEN 'Campaign' WHEN 7 THEN 'Social' WHEN 8 THEN 'AI referral' " +
    "ELSE CAST(events.referrer_type AS Nullable(String)) END AS referrer_type__label, " +
    "any(events.referrer_type) AS referrer_type__id";

  var CHART_SELECT = "toDate(toDateTime(events.server_time, 'UTC')) AS timestamp__to_date";

  function metricsSql(suffix, guard) {
    var and = guard ? ' AND ' + guard : '';
    var only = guard ? ', ' + guard : '';
    return [
      'uniq' + (guard ? 'If' : '') + '(events.session_id' + only + ') AS sessions' + suffix,
      'countIf(events.event_type = 5' + and + ') AS custom_events' + suffix,
      'countIf(events.event_type = 8' + and + ') AS goal_conversions' + suffix,
    ].join(', ');
  }

  function singleQuery(segment, kind) {
    var predicates = segmentPredicates(segment);
    var isTable = kind === 'table';
    return 'SELECT ' + (isTable ? TABLE_SELECT : CHART_SELECT) + ', ' + metricsSql('', null) + '\n' +
      'FROM events AS events\n' +
      'WHERE ' + scopeSql('events') +
      (predicates.length ? '\n    AND ' + predicates.join('\n    AND ') : '') + '\n' +
      (isTable
        ? 'GROUP BY referrer_type__label WITH TOTALS\nORDER BY sessions DESC, referrer_type__label ASC\nLIMIT 0, 50'
        : 'GROUP BY timestamp__to_date WITH TOTALS\nORDER BY timestamp__to_date ASC\nLIMIT 0, 10000');
  }

  // Comparison puts both segments in one pass: each becomes a boolean column on
  // a subquery over the report scope, and every metric is measured twice.
  function compareQuery(segmentA, segmentB, kind) {
    var isTable = kind === 'table';
    var flags = [segmentA, segmentB].map(function (segment, index) {
      var predicates = segmentPredicates(segment).map(function (sql) {
        return sql.replace(/^events\.session_id/, 'comparison_events.session_id')
          .replace(/\bevents\./g, 'comparison_events.');
      });
      var expression = predicates.length ? predicates.join('\n            AND ') : '1';
      return '        ' + expression + ' AS segment_' + index;
    });

    return 'SELECT ' + (isTable ? TABLE_SELECT : CHART_SELECT) + ', ' +
      metricsSql('____0', 'segment_0') + ', ' + metricsSql('____1', 'segment_1') + '\n' +
      'FROM (\n    SELECT\n        comparison_events.*,\n' + flags.join(',\n') + '\n' +
      '    FROM events AS comparison_events\n' +
      '    WHERE ' + scopeSql('comparison_events').replace(/\n    /g, '\n        ') + '\n' +
      ') AS events\n' +
      'WHERE segment_0 OR segment_1\n' +
      (isTable
        ? 'GROUP BY referrer_type__label WITH TOTALS\nORDER BY sessions____0 DESC, referrer_type__label ASC\nLIMIT 0, 50'
        : 'GROUP BY timestamp__to_date WITH TOTALS\nORDER BY timestamp__to_date ASC\nLIMIT 0, 10000');
  }

  // ---------------------------------------------------------------------
  // ClickHouse result -> the row shapes the table and chart already render
  // ---------------------------------------------------------------------
  function num(value) {
    return value === null || value === undefined ? 0 : Number(value);
  }

  function pct(value, total) {
    return (total ? (100 * value / total) : 0).toFixed(2) + '%';
  }

  function rate(conversions, sessions) {
    return sessions ? Math.round(10000 * conversions / sessions) / 100 : 0;
  }

  function tableRows(rows, totals, suffix) {
    var totalSessions = num(totals['sessions' + suffix]);
    var totalEvents = num(totals['custom_events' + suffix]);
    var totalConversions = num(totals['goal_conversions' + suffix]);
    return rows.map(function (row) {
      var sessions = num(row['sessions' + suffix]);
      var events = num(row['custom_events' + suffix]);
      var conversions = num(row['goal_conversions' + suffix]);
      return {
        name: row.referrer_type__label,
        sessions: sessions, sessionsp: pct(sessions, totalSessions),
        ce: events, cep: pct(events, totalEvents),
        gc: conversions, gcp: pct(conversions, totalConversions),
        gcr: pct(conversions, sessions),
      };
    });
  }

  function tableTotals(totals, suffix) {
    var sessions = num(totals['sessions' + suffix]);
    var conversions = num(totals['goal_conversions' + suffix]);
    return {
      sessions: sessions,
      ce: num(totals['custom_events' + suffix]),
      gc: conversions,
      gcr: pct(conversions, sessions),
    };
  }

  function chartRows(rows) {
    return rows.map(function (row) {
      var sessions = num(row.sessions);
      var conversions = num(row.goal_conversions);
      return {
        name: row.timestamp__to_date + 'T00:00:00.000Z',
        sessions: sessions,
        customEvents: num(row.custom_events),
        goalConversions: conversions,
        goalConversionRate: rate(conversions, sessions),
      };
    });
  }

  function compareChartRows(rows) {
    return rows.map(function (row) {
      var sessionsA = num(row.sessions____0), sessionsB = num(row.sessions____1);
      var conversionsA = num(row.goal_conversions____0), conversionsB = num(row.goal_conversions____1);
      return {
        name: row.timestamp__to_date + 'T00:00:00.000Z',
        sessionsA: sessionsA, sessionsB: sessionsB,
        customEventsA: num(row.custom_events____0), customEventsB: num(row.custom_events____1),
        goalConversionsA: conversionsA, goalConversionsB: conversionsB,
        goalConversionRateA: rate(conversionsA, sessionsA),
        goalConversionRateB: rate(conversionsB, sessionsB),
      };
    });
  }

  // ---------------------------------------------------------------------
  // Segment registry: the presets, plus anything built or edited in the editor.
  // Kept in React state only — every change lasts until the page is reloaded,
  // which is what a throwaway prototype should do.
  // ---------------------------------------------------------------------
  // An edited preset is stored under its own value, so it overrides the preset
  // instead of appearing next to it as a near-duplicate entry.
  function segmentDefinition(value, customSegments) {
    if (!value) return null;
    var override = customSegments && customSegments[value];
    if (override) return override;
    if (value === 'all-visitors') return null;
    return SEGMENT_PRESETS[value] || null;
  }

  // Custom segments get their own key space so they can never shadow a preset.
  function customSegmentValue(name, existing) {
    var slug = 'custom-' + String(name || 'segment').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var taken = Object.assign({}, existing);
    CONTEXT_BAR_SEGMENTS.forEach(function (item) { taken[item.value] = true; });
    if (!taken[slug]) return slug;
    for (var index = 2; ; index++) {
      if (!taken[slug + '-' + index]) return slug + '-' + index;
    }
  }

  function segmentItems(customSegments) {
    var overrides = customSegments || {};
    var items = CONTEXT_BAR_SEGMENTS.map(function (item) {
      var override = overrides[item.value];
      return override ? { name: override.segmentName || item.name, value: item.value } : item;
    });
    Object.keys(overrides).forEach(function (value) {
      var known = CONTEXT_BAR_SEGMENTS.some(function (item) { return item.value === value; });
      if (!known) items.push({ name: overrides[value].segmentName || value, value: value });
    });
    return items;
  }

  // ---------------------------------------------------------------------
  // The one place that talks to ClickHouse for the report. Re-runs whenever
  // the selected segments change.
  // ---------------------------------------------------------------------
  function useReportData(baseSegment, compareSegment, customSegments) {
    var initial = { loading: true, error: null, table: null, chart: null, compare: false, sql: null };
    var state = React.useState(initial);
    var report = state[0], setReport = state[1];
    var baseValue = (baseSegment && baseSegment.value) || 'all-visitors';
    var compareValue = compareSegment && compareSegment.value;

    React.useEffect(function () {
      var cancelled = false;
      var compare = !!compareValue;
      var definitionA = segmentDefinition(baseValue, customSegments);
      var definitionB = compare ? segmentDefinition(compareValue, customSegments) : null;

      var tableSql, chartSql;
      try {
        tableSql = compare ? compareQuery(definitionA, definitionB, 'table') : singleQuery(definitionA, 'table');
        chartSql = compare ? compareQuery(definitionA, definitionB, 'chart') : singleQuery(definitionA, 'chart');
      } catch (error) {
        setReport({ loading: false, error: error.message, table: null, chart: null, compare: compare, sql: null });
        return;
      }

      setReport(function (previous) {
        return Object.assign({}, previous, { loading: true, error: null, sql: { table: tableSql, chart: chartSql } });
      });

      Promise.all([chQuery(tableSql), chQuery(chartSql)]).then(function (results) {
        if (cancelled) return;
        var tableResult = results[0], chartResult = results[1];
        var totals = tableResult.totals || {};
        setReport({
          loading: false,
          error: null,
          compare: compare,
          sql: { table: tableSql, chart: chartSql },
          table: compare
            ? {
              rowsA: tableRows(tableResult.data, totals, '____0'),
              rowsB: tableRows(tableResult.data, totals, '____1'),
              totalsA: tableTotals(totals, '____0'),
              totalsB: tableTotals(totals, '____1'),
            }
            : { rows: tableRows(tableResult.data, totals, ''), totals: tableTotals(totals, '') },
          chart: compare ? compareChartRows(chartResult.data) : chartRows(chartResult.data),
        });
      }).catch(function (error) {
        if (cancelled) return;
        setReport({
          loading: false,
          error: error.message,
          table: null,
          chart: null,
          compare: compare,
          sql: { table: tableSql, chart: chartSql },
        });
      });

      return function () { cancelled = true; };
    }, [baseValue, compareValue, customSegments]);

    return report;
  }

  function fmtNum(value) {
    return typeof value === 'number' ? value.toLocaleString('en-US') : value;
  }


  function ChartSection(props) {
    var compareSegment = props.compareSegment;
    var compareMode = !!compareSegment;

    var state = React.useState(METRICS.filter(function (m) { return m.checked; }).map(function (m) { return m.id; }));
    var selected = state[0], setSelected = state[1];

    // Comparing two segments only makes sense for one metric plotted as two
    // lines, so the metric legend switches from a multi-checkbox selector to
    // a single-select (radio) one via Chart's own clickableLegendProps.single.
    var compareMetricState = React.useState(METRICS[0].id);
    var compareMetricId = compareMetricState[0], setCompareMetricId = compareMetricState[1];

    function onSelect(id, checked) {
      if (compareMode) {
        setCompareMetricId(id);
        return;
      }
      setSelected(function (prev) {
        if (checked) return prev.indexOf(id) !== -1 ? prev : prev.concat([id]);
        return prev.filter(function (x) { return x !== id; });
      });
    }

    // Per-day series straight from ClickHouse (props.report, built by
    // useReportData in App) — one row per day for the selected segment, or the
    // paired A/B columns of the comparison query.
    var data, seriesConfig, chartCompareMode;
    var chartData = props.report && props.report.chart ? props.report.chart : [];

    if (compareMode) {
      var metric = METRICS.filter(function (m) { return m.id === compareMetricId; })[0] || METRICS[0];
      var keyA = metric.id + 'A';
      var keyB = metric.id + 'B';
      data = chartData.map(function (row) {
        var out = { name: row.name };
        out[keyA] = row[metric.id + 'A'];
        out[keyB] = row[metric.id + 'B'];
        return out;
      });
      seriesConfig = [
        { id: keyA, name: metric.name, axisY: metric.axisY, color: 'blue' },
        { id: keyB, name: metric.name, axisY: metric.axisY, color: 'violet' },
      ];
      chartCompareMode = [(props.baseSegment && props.baseSegment.name) || 'All visitors', compareSegment.name];
    } else {
      data = chartData;
      seriesConfig = METRICS.filter(function (m) { return selected.indexOf(m.id) !== -1; }).map(function (m) {
        return { id: m.id, name: m.name, axisY: m.axisY, color: m.color || undefined };
      });
      chartCompareMode = [];
    }

    return h(Card, {},
      h('div', { className: 'chart-bordered' },
        h('div', { className: 'chart-toolbar' },
          h('div', {}),
          h('div', { className: 'chart-toolbar__right' },
            h(Select, {
              name: 'granularity',
              value: 'day',
              options: [{ id: 0, name: '', items: [
                { name: 'Day', id: 'day', value: 'day' },
                { name: 'Week', id: 'week', value: 'week' },
                { name: 'Month', id: 'month', value: 'month' },
              ] }],
              onChange: noop,
            }),
            h(Button, { appearance: 'default', icon: 'actions', onClick: noop })
          )
        ),
        h(Chart, {
          type: 'line',
          height: 260,
          data: data,
          seriesConfig: seriesConfig,
          dateOnXAxis: true,
          labelX: 'Date (group by day)',
          hideTooltip: false,
          compareMode: chartCompareMode,
          clickableLegendProps: {
            enabled: true,
            selected: compareMode ? [compareMetricId] : selected,
            onSelect: onSelect,
            series: METRICS.map(function (m) { return { id: m.id, name: m.name }; }),
            single: compareMode,
          },
        })
      )
    );
  }

  // ---------------------------------------------------------------------
  // Query state banner — the report is a live ClickHouse round-trip now, so a
  // stalled container or an unsupported segment has to be visible rather than
  // silently leaving the last numbers on screen.
  // ---------------------------------------------------------------------
  function ReportStatus(props) {
    var report = props.report || {};
    if (!report.loading && !report.error) return null;
    return h('div', { className: 'report-status' + (report.error ? ' report-status--error' : '') },
      report.error
        ? h('div', {},
          h('strong', {}, (window.PP_STATIC ? 'Report data unavailable: ' : 'ClickHouse query failed: ')),
          report.error,
          h('div', { className: 'report-status__hint' },
            window.PP_STATIC
              ? 'The segment editor is fully interactive: open \u201cAll visitors\u201d, then \u201cCreate segment\u201d.'
              : 'Is the container up? ../run.sh starts it; ?ch=http://host:port/ points the page elsewhere.')
        )
        : 'Querying ClickHouse…'
    );
  }

  // ---------------------------------------------------------------------
  // Scope note — which scope the applied segment(s) use and what that means
  // for the numbers below. Interviews: the same columns change meaning with the
  // scope ("semantic drift"), nothing on the report says which scope is active,
  // and event scope returning 0 goal conversions surprised 4 of 4 participants.
  // ---------------------------------------------------------------------
  var SCOPE_REPORT_NOTES = {
    session: 'Session scope: the report shows every event and goal conversion from the sessions that match, not only the events you filtered on.',
    event: 'Event scope: the report contains only the events that match your conditions. Goal conversions are separate events, so they show 0 unless a condition matches them — switch to a session-scope segment to see conversions from the same visits.',
  };

  function SegmentScopeNote(props) {
    var notes = [props.baseSegment, props.compareSegment].map(function (segment) {
      if (!segment) return null;
      var definition = segmentDefinition(segment.value, props.customSegments);
      if (!definition) return null;
      return { name: segment.name, scope: definition.scope === 'event' ? 'event' : 'session' };
    }).filter(Boolean);
    if (!notes.length) return null;
    return h('div', { className: 'scope-note' },
      notes.map(function (note, index) {
        return h('div', { key: index + note.name, className: 'scope-note__row' },
          h(Badge, { text: note.scope.toUpperCase(), color: note.scope === 'session' ? 'blue' : 'gray', size: 'small' }),
          h('span', { className: 'scope-note__text' },
            h('strong', {}, note.name), ' — ', SCOPE_REPORT_NOTES[note.scope])
        );
      })
    );
  }

  // ---------------------------------------------------------------------
  // Page header (title + date range + action buttons)
  // ---------------------------------------------------------------------
  function PageHeader() {
    return h('div', {},
      h('div', { className: 'page-header__titlerow' },
        h(Title, {}, 'Channels'),
        h(Stack, { spacing: 'narrow' },
          h(Stack.Item, {}, h(Button, { appearance: 'primary', text: 'Customize' })),
          h(Stack.Item, {}, h(Button, { appearance: 'default', icon: 'link', text: 'Share' })),
          h(Stack.Item, {}, h(Button, { appearance: 'default', text: 'Export' })),
          h(Stack.Item, {}, h(Button, { appearance: 'simple', icon: 'actions', onClick: noop }))
        )
      )
    );
  }

  // ---------------------------------------------------------------------
  // Sub-report tabs + nested dimensions breadcrumb
  // ---------------------------------------------------------------------
  function SubTabs() {
    var state = React.useState('channels');
    var active = state[0], setActive = state[1];
    var tabs = [
      { id: 'channels', label: 'Channels', value: 'channels' },
      { id: 'source-medium', label: 'Source / medium', value: 'source-medium' },
    ];
    return h('div', {},
      h(Tabs, { tabs: tabs, active: active, setActive: setActive }),
      h('div', { className: 'nested-dims' },
        h(Text, { size: 13, color: 'gray' }, 'Nested dimensions: '),
        h(Breadcrumb, {
          elements: [
            { text: 'Main traffic channels', onClick: noop },
            { text: 'Source / medium' },
          ],
        })
      )
    );
  }

  // ---------------------------------------------------------------------
  // Data table
  // ---------------------------------------------------------------------
  // Shown until the first ClickHouse response lands, and whenever a query fails.
  var EMPTY_TOTALS = { sessions: 0, ce: 0, gc: 0, gcr: '0.00%' };

  function metricCell(value, pct) {
    return {
      content: h('div', { className: 'metric-cell' },
        h('div', { className: 'metric-cell__value' }, value),
        pct ? h('div', { className: 'metric-cell__pct' }, pct) : null
      ),
      textAlign: 'right',
    };
  }

  // Segment-comparison variant: splits a cell into two colored sub-values
  // (segment A / segment B), each keeping its own percentage-of-total line.
  function compareMetricCell(valueA, pctA, valueB, pctB) {
    return {
      content: h('div', { className: 'metric-cell metric-cell--compare' },
        h('div', { className: 'metric-cell__segment metric-cell__segment--a' },
          h('div', { className: 'metric-cell__value' }, valueA),
          pctA ? h('div', { className: 'metric-cell__pct' }, pctA) : null
        ),
        h('div', { className: 'metric-cell__segment metric-cell__segment--b' },
          h('div', { className: 'metric-cell__value' }, valueB),
          pctB ? h('div', { className: 'metric-cell__pct' }, pctB) : null
        )
      ),
      textAlign: 'right',
    };
  }

  function channelCell(row) {
    return {
      content: h('div', { className: 'url-cell' },
        h(Checkbox, { name: 'row-' + row.name, checked: false, onChange: noop }),
        h(Link, {}, row.name)
      ),
    };
  }

  function DataSection(props) {
    var compareSegment = props.compareSegment;
    var compareMode = !!compareSegment;

    var sortState = React.useState({ column: 'sessions', order: 'desc' });
    var sort = sortState[0], setSort = sortState[1];

    var goalState = React.useState('allGoals');
    var goalFilter = goalState[0], setGoalFilter = goalState[1];

    function sortableFor(colId) {
      return {
        order: sort.column === colId ? sort.order : undefined,
        selected: sort.column === colId,
        onClick: function () {
          setSort({ column: colId, order: sort.column === colId && sort.order === 'desc' ? 'asc' : 'desc' });
        },
      };
    }

    var nameHeader = h('div', { className: 'col-header-with-icon' },
      h('span', {}, 'Main traffic channels')
    );

    var columns = [
      { header: nameHeader, accessor: 'name', sortable: sortableFor('name') },
      { header: 'Sessions', accessor: 'sessions', textAlign: 'right', sortable: sortableFor('sessions') },
      { header: 'Custom events', accessor: 'ce', textAlign: 'right', sortable: sortableFor('ce') },
      { header: 'Goal conversions', accessor: 'gc', textAlign: 'right', sortable: sortableFor('gc') },
      { header: 'Goal conversion rate', accessor: 'gcr', textAlign: 'right', sortable: sortableFor('gcr') },
    ];

    // Both sides come out of the same query: a single-segment report fills
    // rows/totals, a comparison fills rowsA/rowsB and totalsA/totalsB.
    var table = props.report && props.report.table;
    var activeRows = [], activeTotals = EMPTY_TOTALS, rowsB = [], totalsB = EMPTY_TOTALS;
    if (table && compareMode && table.rowsA) {
      activeRows = table.rowsA;
      activeTotals = table.totalsA;
      rowsB = table.rowsB;
      totalsB = table.totalsB;
    } else if (table && table.rows) {
      activeRows = table.rows;
      activeTotals = table.totals;
    }

    // Different segments' real-data rows aren't guaranteed to list channels
    // in the same order (e.g. 'all-visitors' sorts Social before Website,
    // 'play-event' sorts Website before Social) — pair "B" values by channel
    // name rather than array index, or a compare row would silently attach
    // to the wrong channel.
    var rowsBByName = {};
    rowsB.forEach(function (r) { rowsBByName[r.name] = r; });

    var data = [
      compareMode ? {
        name: { content: '' },
        sessions: compareMetricCell(fmtNum(activeTotals.sessions), null, fmtNum(totalsB.sessions), null),
        ce: compareMetricCell(fmtNum(activeTotals.ce), null, fmtNum(totalsB.ce), null),
        gc: compareMetricCell(fmtNum(activeTotals.gc), null, fmtNum(totalsB.gc), null),
        gcr: compareMetricCell(activeTotals.gcr, null, totalsB.gcr, null),
        bold: true,
      } : {
        name: { content: '' },
        sessions: metricCell(fmtNum(activeTotals.sessions)),
        ce: metricCell(fmtNum(activeTotals.ce)),
        gc: metricCell(fmtNum(activeTotals.gc)),
        gcr: metricCell(activeTotals.gcr),
        bold: true,
      },
    ].concat(activeRows.map(function (row, i) {
      if (compareMode) {
        var rb = rowsBByName[row.name] || { sessions: 0, ce: 0, gc: 0, gcr: '0.00%' };
        return {
          name: channelCell(row),
          sessions: compareMetricCell(row.sessions, row.sessionsp, fmtNum(rb.sessions), totalsB.sessions ? ((rb.sessions / totalsB.sessions) * 100).toFixed(2) + '%' : '0.00%'),
          ce: compareMetricCell(row.ce, row.cep, fmtNum(rb.ce), totalsB.ce ? ((rb.ce / totalsB.ce) * 100).toFixed(2) + '%' : '0.00%'),
          gc: compareMetricCell(row.gc, row.gcp, fmtNum(rb.gc), totalsB.gc ? ((rb.gc / totalsB.gc) * 100).toFixed(2) + '%' : '0.00%'),
          gcr: compareMetricCell(row.gcr, null, rb.gcr, null),
        };
      }
      return {
        name: channelCell(row),
        sessions: metricCell(row.sessions, row.sessionsp),
        ce: metricCell(row.ce, row.cep),
        gc: metricCell(row.gc, row.gcp),
        gcr: metricCell(row.gcr),
      };
    }));

    var compareLegend = compareMode ? h('div', { className: 'compare-legend' },
      h('span', { className: 'compare-legend__item compare-legend__item--a' }, (props.baseSegment && props.baseSegment.name) || 'All visitors'),
      h('span', { className: 'compare-legend__item compare-legend__item--b' }, compareSegment.name)
    ) : null;

    var toolbar = h('div', {},
      h('div', { className: 'table-toolbar' },
        h(Select, {
          name: 'dimension',
          value: 'mainChannels',
          options: [{ id: 0, name: '', items: [
            { name: 'Main traffic channels', id: 'mainChannels', value: 'mainChannels' },
          ] }],
          onChange: noop,
        }),
        h(Icon, { name: 'sort', size: 'default', color: 'gray', onClick: noop }),
        h(Icon, { name: 'plus', size: 'default', color: 'gray', onClick: noop }),
        h(TextField, { name: 'search', placeholder: 'Search', icon: 'search', onChange: noop }),
        h(Button, { appearance: 'default', text: 'Search' }),
        h(Button, { appearance: 'default', text: 'Quick filters' }),
        h(Button, { appearance: 'simple', icon: 'actions', onClick: noop })
      ),
      h('div', { className: 'goal-filter-bar' },
        h(Select, {
          name: 'goalFilter',
          value: goalFilter,
          options: [{ id: 0, name: '', items: [
            { name: 'All goals', id: 'allGoals', value: 'allGoals' },
          ] }],
          onChange: setGoalFilter,
        })
      ),
      compareLegend
    );

    return h(DataTable, {
      columns: columns,
      data: data,
      fullWidth: true,
      toolbar: toolbar,
    });
  }

  // ---------------------------------------------------------------------
  // Advanced Segment Editor modal (Session vs Event scope)
  // Ported from Claude Design artifact "Advanced segments editor"
  // ---------------------------------------------------------------------
  var SEGMENT_OPERATOR_OPTIONS = [{ id: 0, name: '', items: [
    { id: 1, value: 'is', name: 'is' },
    { id: 2, value: 'is not', name: 'is not' },
    { id: 3, value: 'contains', name: 'contains' },
    { id: 4, value: 'does not contain', name: 'does not contain' },
    { id: 5, value: 'starts with', name: 'starts with' },
    { id: 6, value: 'ends with', name: 'ends with' },
  ] }];

  var SEGMENT_MODE_ITEMS = [{ value: 'include', name: 'Include' }, { value: 'exclude', name: 'Exclude' }];

  // The side list in the editor. Every entry has a SEGMENT_COLUMNS mapping. The
  // first group ("Session") is the only one accepted by the session-attribute
  // dropzones in the SESSION box at the top — see SESSION_DIMENSIONS below —
  // everything else is accepted only by the per-event condition boxes.
  var DIMENSION_GROUPS = [
    { title: 'Session', items: [
      { text: 'Events in session' },
      { text: 'Session entry URL' },
      { text: 'Goal conversions in session' },
      { text: 'Device type' },
      { text: 'Country' },
      { text: 'Source / medium' },
    ] },
    { title: 'Page view', items: [
      { text: 'Page URL', icon: 'flag' },
      { text: 'Page title', icon: 'flag' },
    ] },
    { title: 'Goal', items: [
      { text: 'Event type', icon: 'flag' },
      { text: 'Goal name', icon: 'flag' },
      { text: 'Goal revenue', icon: 'flag' },
    ] },
    { title: 'Custom event', items: [
      { text: 'Custom event category', icon: 'flag' },
      { text: 'Custom event action', icon: 'flag' },
      { text: 'Custom event name', icon: 'flag' },
      { text: 'Custom event value', icon: 'flag' },
    ] },
  ];

  var DIMENSION_ICONS = DIMENSION_GROUPS.reduce(function (icons, group) {
    group.items.forEach(function (item) { icons[item.text] = item.icon; });
    return icons;
  }, {});

  var ALL_DIMENSIONS = Object.keys(DIMENSION_ICONS);

  // Session attributes (the "Session" group) describe the session as a whole and
  // are evaluated once per session — they belong only in "Additional event
  // filtering". Everything else describes a single event and belongs only in the
  // event-condition boxes above it. The two sets are disjoint on purpose: dropping
  // a session attribute into an event box (or an event dimension into the
  // session-attribute box) is rejected by the dropzone's `accepts` check.
  var SESSION_DIMENSIONS = DIMENSION_GROUPS[0].items.map(function (item) { return item.text; });
  var EVENT_DIMENSIONS = ALL_DIMENSIONS.filter(function (dim) { return SESSION_DIMENSIONS.indexOf(dim) === -1; });

  // A new row starts on a value that exists in the demo data, so adding a
  // condition shows a real number instead of an empty report.
  var DIMENSION_DEFAULT_VALUES = {
    'Custom event action': 'Play',
    'Custom event name': 'Video B',
    'Goal name': 'Consumer Loan Calculator',
    'Event type': 'Custom event',
    'Device type': 'Smartphone',
  };

  function newConditionRow(dim) {
    return {
      dim: dim,
      icon: DIMENSION_ICONS[dim],
      op: 'is',
      val: DIMENSION_DEFAULT_VALUES[dim] || '',
    };
  }

  var SEGMENT_SCOPE_EXPLAINERS = {
    session: 'Conditions can be satisfied by different events in the same session. Reports return every event and metric from the qualifying sessions, not only the events that matched.',
    event: 'All conditions are evaluated against one single event. Reports return only the matching events — this is how segments behave today.',
  };

  function segmentScopeTile(label, desc) {
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' } },
      h('div', { style: { fontSize: 14, fontWeight: 700, color: 'var(--vInk)' } }, label),
      h('div', { style: { fontSize: 12, fontWeight: 400, lineHeight: 1.4, color: 'var(--vInkLighter)' } }, desc)
    );
  }

  var SEGMENT_SCOPE_ITEMS = [
    { id: 1, value: 'session', icon: 'days-and-sessions', disabled: false, name: segmentScopeTile('Session', 'Find sessions containing events that match your conditions. Reports show all activity within those sessions.') },
    { id: 2, value: 'event', icon: 'custom-event', disabled: false, name: segmentScopeTile('Event', 'Filter individual events. Reports show only the matching events.') },
    { id: 3, value: 'visitor', icon: 'tracker-visitor', disabled: true, badge: { color: 'gray', text: 'COMING LATER' }, name: segmentScopeTile('Visitor', 'Match visitors across every session they had in the date range.') },
  ];

  // Per-segment condition data. Keyed by CONTEXT_BAR_SEGMENTS[].value. Drives the
  // condition-builder's initial state so opening a real segment shows its real
  // conditions instead of one hardcoded example regardless of which row was clicked.
  // Shape:
  //   scope: 'session' | 'event'
  //   eventScopeGroups: [[row,...], [row,...]] — same OR-of-AND shape as
  //     sessionAttrGroups/eventClusters.groups: rows within a group are AND'd,
  //     groups are OR'd
  //   sessionAttrGroups: [[row,...], [row,...]] — same OR-of-AND shape as
  //     eventClusters.groups: rows within a group are AND'd, groups are OR'd
  //   eventClusters (session scope only): [{ id, mode: 'include'|'exclude', groups: [[row,...], [row,...]] }]
  //     — groups.length > 1 means those row-sets are OR'd together (different events
  //     in the same session can each satisfy one of the OR'd alternatives).
  var SEGMENT_PRESETS = {
    'default': {
      segmentName: 'A/B test A — contact form conversions',
      segmentDescription: 'Sessions that saw product page variant A and later submitted the contact form.',
      scope: 'session',
      sessionAttrGroups: [[
        { dim: 'Device type', op: 'is', val: 'Mobile' },
        { dim: 'Source / medium', op: 'contains', val: 'google / cpc' },
      ]],
      eventClusters: [
        { id: 'pageUrl', mode: 'include', groups: [[{ dim: 'Page URL', icon: 'flag', op: 'contains', val: '/product?version=A' }]] },
        { id: 'goal', mode: 'include', groups: [[{ dim: 'Goal name', icon: 'flag', op: 'is', val: 'Contact form submitted' }]] },
        { id: 'notPurchase', mode: 'exclude', groups: [[{ dim: 'Custom event name', icon: 'flag', op: 'is', val: 'Purchase Completed' }]] },
      ],
      eventScopeGroups: [[
        { dim: 'Custom event action', icon: 'flag', op: 'is', val: 'landingpage_cta_button1' },
      ]],
    },
    // Starting point for "Manage segments -> new segment": no conditions, so the
    // first thing you add is the first thing that filters.
    'new': {
      segmentName: 'New segment',
      segmentDescription: '',
      scope: 'session',
      sessionAttrGroups: [],
      eventClusters: [],
      eventScopeGroups: [],
    },
    // 'All visitors' is the true unfiltered baseline: no session attributes, no
    // event clusters, no event-scope rows. Explicit entry so it never falls
    // through to the 'default' preset above (which carries example conditions).
    'all-visitors': {
      segmentName: 'All visitors',
      segmentDescription: 'The full unfiltered dataset — no conditions applied.',
      scope: 'session',
      sessionAttrGroups: [],
      eventClusters: [],
      eventScopeGroups: [],
    },
    // ---------------------------------------------------------------------
    // Event-vs-session scope walkthrough.
    // ---------------------------------------------------------------------
    'play-event': {
      segmentName: 'Played a video — event segment',
      segmentDescription: 'Individual custom events where the action was "Play". Event scope: reports return only the matching events — a goal-conversion event never matches this condition, so Conversions come back as 0.',
      scope: 'event',
      eventScopeGroups: [[
        { dim: 'Custom event action', icon: 'flag', op: 'is', val: 'Play' },
      ]],
    },
    'play-session': {
      segmentName: 'Played a video — session segment',
      segmentDescription: 'Sessions that contain at least one custom event where the action was "Play". Session scope: reports return every event and every conversion from the qualifying sessions, not just the Play events themselves.',
      scope: 'session',
      eventClusters: [
        { id: 'play', mode: 'include', groups: [[{ dim: 'Custom event action', icon: 'flag', op: 'is', val: 'Play' }]] },
      ],
    },
    'not-play-session': {
      segmentName: 'Did NOT play a video — session segment',
      segmentDescription: 'Sessions that do NOT contain a custom event where the action was "Play" — the complement of "Played a video — session segment", used to compare conversion performance between visitors who played a video and visitors who didn’t.',
      scope: 'session',
      eventClusters: [
        { id: 'play', mode: 'exclude', groups: [[{ dim: 'Custom event action', icon: 'flag', op: 'is', val: 'Play' }]] },
      ],
    },
    'video-b-session': {
      segmentName: 'Played Video B — session segment',
      segmentDescription: 'Sessions containing a Play event for Video B.',
      scope: 'session',
      eventClusters: [
        {
          id: 'video', mode: 'include', groups: [
            [{ dim: 'Custom event action', icon: 'flag', op: 'is', val: 'Play' }, { dim: 'Custom event name', icon: 'flag', op: 'is', val: 'Video B' }],
          ],
        },
      ],
    },
    'video-a-or-c-session': {
      segmentName: 'Played Video A or C — session segment',
      segmentDescription: 'Sessions containing a Play event for Video A or Video C, compared against "Played Video B" to see performance across videos.',
      scope: 'session',
      eventClusters: [
        {
          id: 'video', mode: 'include', groups: [
            [{ dim: 'Custom event action', icon: 'flag', op: 'is', val: 'Play' }, { dim: 'Custom event name', icon: 'flag', op: 'is', val: 'Video A' }],
            [{ dim: 'Custom event action', icon: 'flag', op: 'is', val: 'Play' }, { dim: 'Custom event name', icon: 'flag', op: 'is', val: 'Video C' }],
          ],
        },
      ],
    },
    'loan-video-b-multievent': {
      segmentName: 'Played Video B AND completed loan calculator',
      segmentDescription: 'Sessions containing two separate matching events: a Play event for Video B, and a goal-completion event for "Consumer Loan Calculator" — the two conditions can be satisfied by different events in the same session.',
      scope: 'session',
      eventClusters: [
        { id: 'video', mode: 'include', groups: [[{ dim: 'Custom event action', icon: 'flag', op: 'is', val: 'Play' }, { dim: 'Custom event name', icon: 'flag', op: 'is', val: 'Video B' }]] },
        { id: 'loanGoal', mode: 'include', groups: [[{ dim: 'Goal name', icon: 'flag', op: 'is', val: 'Consumer Loan Calculator' }]] },
      ],
    },
    'loan-video-b-smartphone': {
      segmentName: 'Played Video B AND completed loan calculator, on Smartphone',
      segmentDescription: 'Same as "Played Video B AND completed loan calculator", further narrowed to sessions on Smartphone devices — a session-level attribute evaluated once per session, alongside the two required events.',
      scope: 'session',
      sessionAttrGroups: [[
        { dim: 'Device type', op: 'is', val: 'Smartphone' },
      ]],
      eventClusters: [
        { id: 'video', mode: 'include', groups: [[{ dim: 'Custom event action', icon: 'flag', op: 'is', val: 'Play' }, { dim: 'Custom event name', icon: 'flag', op: 'is', val: 'Video B' }]] },
        { id: 'loanGoal', mode: 'include', groups: [[{ dim: 'Goal name', icon: 'flag', op: 'is', val: 'Consumer Loan Calculator' }]] },
      ],
    },
  };

  // ---------------------------------------------------------------------
  // Segment editor v3 — sentence-style builder, no drag & drop.
  //
  // Reads top-down as one sentence: "Find sessions where … that contain an event
  // where … that contain another event where …". Dimensions are added through an
  // "Add dimension" popover, and AND / OR appear on hover at the bottom edge of
  // the group / card they extend. Data shapes are unchanged from v1/v2
  // (sessionAttrGroups, eventClusters[].groups, eventScopeGroups), so the SQL
  // builder and the report do not care which editor produced a segment.
  // ---------------------------------------------------------------------

  // The editor designs are served side by side (see local-ch/docker-compose.yml);
  // the bottom bar switches between them. A half-built segment travels along in
  // the URL hash, so changing design does not mean starting over.
  var APP_VERSION = 'v3';
  // The "where" / "contain" selects are drawn in ink with a grey dotted underline
  // and a chevron (the .inline-dotted styles in app.css).
  document.documentElement.classList.add('inline-dotted');

  var EDITOR_VERSIONS = [
    { value: 'v3', name: 'v3 \u00b7 Click to add', port: 8422 },
    { value: 'v4', name: 'v4 \u00b7 Drag & drop', port: 8423 },
  ];

  function readDraftFromLocation() {
    if (window.PP_STATIC) {
      try {
        var stored = window.localStorage.getItem('pp_draft');
        window.localStorage.removeItem('pp_draft');
        return stored ? JSON.parse(stored) : null;
      } catch (e) { return null; }
    }
    var match = /[#&]draft=([^&]*)/.exec(window.location.hash || '');
    if (!match) return null;
    try { return JSON.parse(decodeURIComponent(match[1])); } catch (e) { return null; }
  }

  var PREVIEW_NUMBERS = {
    session: { count: '325', pct: 50, total: '657' },
    event: { count: '8', pct: 1.2, total: '656' },
  };

  var SCOPE_INFO = {
    session: {
      title: 'Returns the whole session.',
      text: 'One matching event is enough to qualify the entire session — every other event in it counts too, whether or not it matches anything itself.',
    },
    event: {
      title: 'Returns the matching events',
      text: 'Only the events that satisfy the condition are counted — the report has no idea what session they came from, or what else happened in it.',
    },
  };

  var INCLUDE_EXCLUDE_WHERE = [{ value: 'include', name: 'where' }, { value: 'exclude', name: 'where not' }];
  var INCLUDE_EXCLUDE_CONTAIN = [{ value: 'include', name: 'contain' }, { value: 'exclude', name: 'don’t contain' }];
  var OPERATOR_CHOICES = SEGMENT_OPERATOR_OPTIONS[0].items;

  function emptyConditionRow() {
    return { dim: '', op: 'is', val: '' };
  }

  function newEventCluster() {
    return { id: 'cluster-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7), mode: 'include', groups: [] };
  }

  // Event scope is the mirror of the session card: a box is an OR of single-row
  // groups (box.groups = [[row], [row], ...] so the shared group helpers and
  // groupsSql work unchanged), and the boxes are AND'd. Each box has its own
  // include / exclude.
  function newEscopeBox(dim) {
    return {
      id: 'box-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      mode: 'include',
      groups: dim ? [[newConditionRow(dim)]] : [],
    };
  }

  // Presets (and older drafts) still carry the OR-of-AND eventScopeGroups.
  function escopeBoxesFromGroups(groups, mode) {
    var filled = (groups || []).filter(function (group) { return group && group.length; });
    function box(boxGroups) { return Object.assign(newEscopeBox(), { mode: mode || 'include', groups: boxGroups }); }
    if (!filled.length) return [];
    if (filled.length === 1) return filled[0].map(function (row) { return box([[row]]); });
    return [box(filled.map(function (rows) { return [rows[0]]; }))];
  }

  // Every dropdown in the editor is a DS Popover with a DS ActionList inside
  // (the same pairing SegmentPicker uses). MenuPopover only adds "is it open?"
  // state, so the activator can draw its open look.
  function MenuPopover(props) {
    var openState = React.useState(false);
    var open = openState[0], setOpen = openState[1];
    return h(Popover, {
      activatorElement: props.renderActivator(open),
      position: props.position || 'bottom-start',
      noPadding: true,
      onOpen: function () { setOpen(true); },
      onClose: function () { setOpen(false); },
    }, function (close) { return props.renderContent(close); });
  }

  // A short list of fixed choices: [{ value, name }] -> ActionList, current one marked.
  function OptionList(props) {
    return h('div', { className: 'seg-optionlist' },
      h(ActionList, {
        groups: [{ id: 'options', items: props.options.map(function (option) { return { id: option.value, name: option.name }; }) }],
        current: props.value,
        onItemSelected: function (item) { props.close(); props.onPick(item.id); },
      })
    );
  }

  // Blue text with a chevron ("where \u25BE") opening an OptionList.
  function InlineSelect(props) {
    var selected = props.options.filter(function (option) { return option.value === props.value; })[0] || props.options[0];
    return h(MenuPopover, {
      renderActivator: function (open) {
        return h('button', { type: 'button', className: 'seg-inline-select' + (open ? ' seg-inline-select--open' : ''), 'aria-label': props.label },
          selected.name,
          h(Icon, { name: 'chevron-down', size: 'default', color: 'blue' }));
      },
      renderContent: function (close) {
        return h(OptionList, { options: props.options, value: props.value, close: close, onPick: props.onChange });
      },
    });
  }

  // Searchable, grouped list of the dimensions a slot accepts. Session slots get
  // only the Session group, event slots only the event groups (see
  // SESSION_DIMENSIONS / EVENT_DIMENSIONS).
  function DimensionList(props) {
    var queryState = React.useState('');
    var query = queryState[0], setQuery = queryState[1];
    var needle = query.trim().toLowerCase();
    var groups = DIMENSION_GROUPS.map(function (group) {
      return {
        id: group.title,
        name: group.title,
        items: group.items.filter(function (item) {
          return props.dims.indexOf(item.text) !== -1 && (!needle || item.text.toLowerCase().indexOf(needle) !== -1);
        }).map(function (item) { return { id: item.text, name: item.text }; }),
      };
    }).filter(function (group) { return group.items.length; });

    return h('div', { className: 'seg-dimlist' },
      h(Popover.Section, { padding: 'narrow' },
        h(TextField, {
          name: 'dimension-search',
          icon: 'search',
          placeholder: 'Search',
          value: query,
          clearable: true,
          autoFocus: true,
          onChange: function (e) { setQuery(e && e.target ? e.target.value : (e || '')); },
        })
      ),
      h(Popover.Section, { fixedHeight: true },
        h(ActionList, {
          groups: groups,
          emptyListText: 'No matching dimensions',
          onItemSelected: function (item) { props.close(); props.onPick(item.id); },
        })
      )
    );
  }

  // The operator is a DS subdued button that opens an OptionList.
  function OperatorButton(props) {
    var selected = OPERATOR_CHOICES.filter(function (option) { return option.value === props.value; })[0] || OPERATOR_CHOICES[0];
    return h(MenuPopover, {
      renderActivator: function () {
        return h(Button, { appearance: 'subdued', minimalWidth: true, text: selected.name });
      },
      renderContent: function (close) {
        return h(OptionList, {
          options: OPERATOR_CHOICES.map(function (option) { return { value: option.value, name: option.name }; }),
          value: props.value,
          close: close,
          onPick: props.onChange,
        });
      },
    });
  }

  // One condition, written as text: dimension (click to change) · operator · value,
  // all three DS subdued buttons in the small size. The value is plain text until
  // clicked; then it becomes a full-width input with explicit cancel / confirm
  // buttons (Esc and Enter do the same).
  function ConditionRow(props) {
    var row = props.row;
    var editState = React.useState(false);
    var editing = editState[0], setEditing = editState[1];
    var draftState = React.useState('');
    var draft = draftState[0], setDraft = draftState[1];
    var rowRef = React.useRef(null);
    var latest = React.useRef({});
    latest.current = { draft: draft, onChange: props.onChange };

    function startEdit() { setDraft(row.val); setEditing(true); }
    function confirmEdit() { latest.current.onChange({ val: latest.current.draft }); setEditing(false); }
    function cancelEdit() { setEditing(false); }

    // Clicking elsewhere confirms instead of discarding, so a typed value is
    // never lost by moving on (for instance straight to Save).
    React.useEffect(function () {
      if (!editing) return undefined;
      function onDown(e) { if (rowRef.current && !rowRef.current.contains(e.target)) confirmEdit(); }
      document.addEventListener('mousedown', onDown);
      return function () { document.removeEventListener('mousedown', onDown); };
    }, [editing]);

    return h('div', { ref: rowRef, className: 'seg-row' + (editing ? ' seg-row--editing' : '') },
      h(MenuPopover, {
        renderActivator: function (open) {
          return h(Button, {
            appearance: 'subdued',
            minimalWidth: true,
            text: row.dim || 'Dimension',
            className: 'seg-row__dim' + (open ? ' seg-row__dim--open' : ''),
          });
        },
        renderContent: function (close) {
          return h(DimensionList, { dims: props.dims, close: close, onPick: props.onPickDimension });
        },
      }),
      h(OperatorButton, {
        value: row.op,
        onChange: function (value) { props.onChange({ op: value }); },
      }),
      editing
        ? h('input', {
          className: 'seg-row__input',
          type: 'text',
          autoFocus: true,
          'aria-label': 'Value',
          placeholder: 'Type value',
          value: draft,
          onChange: function (e) { setDraft(e.target.value); },
          onKeyDown: function (e) {
            if (e.key === 'Enter') { e.preventDefault(); confirmEdit(); }
            else if (e.key === 'Escape') { e.stopPropagation(); cancelEdit(); }
          },
        })
        : h(Button, {
          appearance: 'subdued',
          minimalWidth: true,
          text: row.val || 'Type value',
          textAlign: 'left',
          cutText: true,
          className: row.val ? 'seg-row__val' : 'seg-row__val seg-btn--empty',
          onClick: startEdit,
        }),
      editing
        ? h('div', { className: 'seg-row__confirm' },
          h('button', { type: 'button', className: 'seg-row__confirm-btn', 'aria-label': 'Cancel', onClick: cancelEdit },
            h(Icon, { name: 'cross', size: 'small' })),
          h('button', { type: 'button', className: 'seg-row__confirm-btn seg-row__confirm-btn--ok', 'aria-label': 'Confirm', onClick: confirmEdit },
            h(Icon, { name: 'checkmark', size: 'small', color: 'white' })))
        : h('div', { className: 'seg-row__tools' },
          h('button', { type: 'button', className: 'seg-row__tool', 'aria-label': 'Duplicate condition', onClick: props.onDuplicate },
            h(Icon, { name: 'duplicate', size: 'default' })),
          h('button', { type: 'button', className: 'seg-row__tool', 'aria-label': 'Remove condition', onClick: props.onRemove },
            h(Icon, { name: 'cross', size: 'default' })))
    );
  }

  // Open arc gauge (270 degrees, gap at the bottom). `value` is 0..1, or null for "No data".
  function Gauge(props) {
    var radius = 80;
    var circumference = 2 * Math.PI * radius;
    var arc = 0.75 * circumference;
    var filled = props.value === null ? 0 : arc * Math.max(0, Math.min(1, props.value));
    return h('div', { className: 'seg-gauge' },
      h('svg', { viewBox: '0 0 200 200', width: 200, height: 200, 'aria-hidden': true },
        h('circle', { cx: 100, cy: 100, r: radius, fill: 'none', strokeWidth: 8, strokeLinecap: 'round', className: 'seg-gauge__track',
          strokeDasharray: arc + ' ' + circumference, transform: 'rotate(135 100 100)' }),
        filled > 0 ? h('circle', { cx: 100, cy: 100, r: radius, fill: 'none', strokeWidth: 8, strokeLinecap: 'round', className: 'seg-gauge__fill',
          strokeDasharray: filled + ' ' + circumference, transform: 'rotate(135 100 100)' }) : null
      ),
      h('div', { className: 'seg-gauge__label' }, props.children)
    );
  }

  function VisibilityMenu(props) {
    var openState = React.useState(false);
    var open = openState[0], setOpen = openState[1];
    var wrapRef = React.useRef(null);
    React.useEffect(function () {
      if (!open) return undefined;
      function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
      function onKey(e) { if (e.key === 'Escape') setOpen(false); }
      document.addEventListener('mousedown', onDown);
      document.addEventListener('keydown', onKey);
      return function () {
        document.removeEventListener('mousedown', onDown);
        document.removeEventListener('keydown', onKey);
      };
    }, [open]);
    return h('div', { ref: wrapRef, className: 'seg-visibility' },
      h('button', { type: 'button', className: 'seg-visibility__trigger', 'aria-expanded': open, onClick: function () { setOpen(!open); } },
        h('span', { className: 'seg-visibility__label' }, 'Visibility:'),
        h('span', { className: 'seg-icon seg-icon--users', 'aria-hidden': true }),
        h('span', { className: 'seg-visibility__value' }, props.visibility === 'all' ? 'All users' : 'Author'),
        h('span', { className: 'seg-visibility__sep' }, '/'),
        h('span', { className: 'seg-icon seg-icon--website', 'aria-hidden': true }),
        h('span', { className: 'seg-visibility__value' }, props.allSites ? 'All sites & apps' : 'This site'),
        h(Icon, { name: 'chevron-down', size: 'tiny' })
      ),
      open ? h('div', { className: 'seg-visibility__menu' },
        h(RadioButtonGroup, {
          name: 'visibility',
          value: props.visibility,
          options: [
            { id: 'author', value: 'author', label: 'Author', caption: 'you@example.com (me)' },
            { id: 'all', value: 'all', label: 'All users', caption: 'All users with access to this site or app can see this segment' },
          ],
          onChange: function (e) { props.onVisibility(e && e.target ? e.target.value : e); },
        }),
        h('div', { style: { marginTop: 12 } },
          h(Checkbox, {
            name: 'allSites',
            label: 'All sites & apps',
            caption: 'This segment will be available across all sites and apps.',
            checked: props.allSites,
            onChange: function (e) { props.onAllSites(!!(e && e.target ? e.target.value : e)); },
          })
        )
      ) : null
    );
  }

  function SegmentEditorModal(props) {
    var stateHook = React.useState(function () {
      var value = (props.segment && props.segment.value) || '';
      var preset = (props.customSegments && props.customSegments[value]) ||
        SEGMENT_PRESETS[value] || SEGMENT_PRESETS['default'];
      var isBrandNew = !value || value === 'new';
      var clusters = (preset.eventClusters || []).slice();
      if (!clusters.length) clusters = [newEventCluster()];
      var initial = {
        scope: preset.scope || 'session',
        segmentName: isBrandNew ? '' : ((props.segment && props.segment.name) || preset.segmentName || ''),
        segmentDescription: preset.segmentDescription || '',
        visibility: 'all',
        allSites: true,
        sessionAttrMode: preset.sessionAttrMode || 'include',
        sessionAttrGroups: preset.sessionAttrGroups || [],
        eventClusters: clusters,
        eventScopeMode: preset.eventScopeMode || 'include',
        eventScopeGroups: preset.eventScopeGroups || [],
        eventScopeBoxes: preset.eventScopeBoxes || escopeBoxesFromGroups(preset.eventScopeGroups, preset.eventScopeMode),
      };
      var draft = props.segment && props.segment.draft;
      if (draft) {
        initial = Object.assign(initial, draft);
        if (!draft.eventScopeBoxes) initial.eventScopeBoxes = escopeBoxesFromGroups(draft.eventScopeGroups, draft.eventScopeMode);
        if (!initial.eventClusters || !initial.eventClusters.length) initial.eventClusters = [newEventCluster()];
      }
      return initial;
    });
    var state = stateHook[0], setState = stateHook[1];

    // OverlayView renders position:fixed, so lock the page behind it and restore
    // its scroll position on close (see the same note in v1).
    React.useEffect(function () {
      var previousScrollY = window.scrollY;
      var previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
      return function () {
        document.body.style.overflow = previousOverflow;
        window.scrollTo(0, previousScrollY);
      };
    }, []);

    function set(key) {
      return function (e) {
        var value = e && e.target ? e.target.value : e;
        setState(function (prev) {
          var next = Object.assign({}, prev);
          next[key] = value;
          return next;
        });
      };
    }

    // A "block" is one card of conditions: 'session' (session attributes),
    // 'escope' (the single card of an event-scope segment) or an event cluster id.
    function blockGroups(s, id) {
      if (id === 'session') return s.sessionAttrGroups;
      if (id === 'escope') return s.eventScopeGroups;
      var cluster = s.eventClusters.filter(function (c) { return c.id === id; })[0] ||
        s.eventScopeBoxes.filter(function (b) { return b.id === id; })[0];
      return cluster ? cluster.groups : [];
    }

    function withBlockGroups(s, id, groups) {
      if (id === 'session') return Object.assign({}, s, { sessionAttrGroups: groups });
      if (id === 'escope') return Object.assign({}, s, { eventScopeGroups: groups });
      function swap(c) { return c.id === id ? Object.assign({}, c, { groups: groups }) : c; }
      return Object.assign({}, s, { eventClusters: s.eventClusters.map(swap), eventScopeBoxes: s.eventScopeBoxes.map(swap) });
    }

    function updateGroups(id, mutate) {
      setState(function (s) { return withBlockGroups(s, id, mutate(blockGroups(s, id))); });
    }

    function blockMode(id) {
      if (id === 'session') return state.sessionAttrMode;
      if (id === 'escope') return state.eventScopeMode;
      var cluster = state.eventClusters.filter(function (c) { return c.id === id; })[0] ||
        state.eventScopeBoxes.filter(function (b) { return b.id === id; })[0];
      return cluster ? cluster.mode : 'include';
    }

    function setBlockMode(id, mode) {
      setState(function (s) {
        if (id === 'session') return Object.assign({}, s, { sessionAttrMode: mode });
        if (id === 'escope') return Object.assign({}, s, { eventScopeMode: mode });
        function swap(c) { return c.id === id ? Object.assign({}, c, { mode: mode }) : c; }
        return Object.assign({}, s, { eventClusters: s.eventClusters.map(swap), eventScopeBoxes: s.eventScopeBoxes.map(swap) });
      });
    }

    function addFirstDimension(id, dim) {
      updateGroups(id, function (groups) { return groups.length ? groups : [[newConditionRow(dim)]]; });
    }

    function addAndRow(id, groupIndex, dim) {
      updateGroups(id, function (groups) {
        return groups.map(function (rows, gi) { return gi === groupIndex ? rows.concat([newConditionRow(dim)]) : rows; });
      });
    }

    function addOrGroup(id, dim) {
      updateGroups(id, function (groups) { return groups.concat([[newConditionRow(dim)]]); });
    }

    // "+ AND" / "+ OR" open the dimension list straight away; the chosen
    // dimension becomes the new condition (no empty row to fill in afterwards).
    function pillWithList(kind, dims, onPick) {
      return h(MenuPopover, {
        position: 'bottom',
        renderActivator: function (open) {
          return h('button', { type: 'button', className: 'seg-pill seg-pill--' + kind + (open ? ' seg-pill--open' : '') }, '+ ' + kind.toUpperCase());
        },
        renderContent: function (close) {
          return h(DimensionList, { dims: dims, close: close, onPick: onPick });
        },
      });
    }

    function patchRow(id, groupIndex, rowIndex, patch) {
      updateGroups(id, function (groups) {
        return groups.map(function (rows, gi) {
          if (gi !== groupIndex) return rows;
          return rows.map(function (row, ri) { return ri === rowIndex ? Object.assign({}, row, patch) : row; });
        });
      });
    }

    // Choosing a dimension for a row resets its operator and value to that
    // dimension's defaults — a value from the old dimension would not make sense.
    function pickDimension(id, groupIndex, rowIndex, dim) {
      patchRow(id, groupIndex, rowIndex, newConditionRow(dim));
    }

    // Removing the last row of a group drops the group; an extra event card that
    // ends up empty goes away too (the first one stays, as the starting point).
    function removeRow(id, groupIndex, rowIndex) {
      setState(function (s) {
        var groups = blockGroups(s, id).map(function (rows, gi) {
          return gi === groupIndex ? rows.filter(function (row, ri) { return ri !== rowIndex; }) : rows;
        }).filter(function (rows) { return rows.length; });
        var next = withBlockGroups(s, id, groups);
        if (!groups.length && id !== 'session' && id !== 'escope' && next.eventClusters.length > 1) {
          next = Object.assign({}, next, { eventClusters: next.eventClusters.filter(function (c) { return c.id !== id; }) });
        }
        if (!groups.length) {
          next = Object.assign({}, next, { eventScopeBoxes: next.eventScopeBoxes.filter(function (b) { return b.id !== id; }) });
        }
        return next;
      });
    }

    // A copy goes right below the original, in the same AND group.
    function duplicateRow(id, groupIndex, rowIndex) {
      updateGroups(id, function (groups) {
        return groups.map(function (rows, gi) {
          if (gi !== groupIndex) return rows;
          var next = rows.slice();
          next.splice(rowIndex + 1, 0, Object.assign({}, rows[rowIndex]));
          return next;
        });
      });
    }

    function addEventCluster() {
      setState(function (s) { return Object.assign({}, s, { eventClusters: s.eventClusters.concat([newEventCluster()]) }); });
    }

    // Event cards can be removed and duplicated; one always stays (the session
    // card above them is the main group and has no such controls).
    function removeEventCluster(id) {
      setState(function (s) {
        if (s.eventClusters.length < 2) return s;
        return Object.assign({}, s, { eventClusters: s.eventClusters.filter(function (c) { return c.id !== id; }) });
      });
    }

    function duplicateEventCluster(id) {
      setState(function (s) {
        var at = -1;
        s.eventClusters.forEach(function (c, i) { if (c.id === id) at = i; });
        if (at < 0) return s;
        var source = s.eventClusters[at];
        var copy = Object.assign({}, source, {
          id: newEventCluster().id,
          groups: source.groups.map(function (rows) { return rows.map(function (row) { return Object.assign({}, row); }); }),
        });
        var next = s.eventClusters.slice();
        next.splice(at + 1, 0, copy);
        return Object.assign({}, s, { eventClusters: next });
      });
    }

    function renderGroups(id, groups, dims) {
      var out = [];
      groups.forEach(function (rows, gi) {
        if (gi > 0) out.push(h('div', { key: id + '-or-' + gi, className: 'seg-or' }, 'OR'));
        var children = [];
        rows.forEach(function (row, ri) {
          if (ri > 0) children.push(h('div', { key: 'and-' + ri, className: 'seg-and' }, 'AND'));
          children.push(h(ConditionRow, {
            key: 'row-' + ri,
            row: row,
            dims: dims,
            onPickDimension: function (dim) { pickDimension(id, gi, ri, dim); },
            onChange: function (patch) { patchRow(id, gi, ri, patch); },
            onDuplicate: function () { duplicateRow(id, gi, ri); },
            onRemove: function () { removeRow(id, gi, ri); },
          }));
        });
        children.push(h('div', { key: 'pills', className: 'seg-pills' },
          pillWithList('and', dims, function (dim) { addAndRow(id, gi, dim); }),
          gi === groups.length - 1
            ? pillWithList('or', dims, function (dim) { addOrGroup(id, dim); })
            : null));
        out.push(h('div', { key: id + '-group-' + gi, className: 'seg-group' }, children));
      });
      return out;
    }

    // ---- Event scope: AND of boxes, each box an OR of conditions --------------
    function addEscopeBox(dim) {
      setState(function (s) { return Object.assign({}, s, { eventScopeBoxes: s.eventScopeBoxes.concat([newEscopeBox(dim)]) }); });
    }

    function addBoxRow(id, dim) {
      updateGroups(id, function (groups) { return groups.concat([[newConditionRow(dim)]]); });
    }

    // A copy of a row is one more OR alternative, right below the original.
    function duplicateBoxRow(id, groupIndex) {
      updateGroups(id, function (groups) {
        var next = groups.slice();
        next.splice(groupIndex + 1, 0, [Object.assign({}, groups[groupIndex][0])]);
        return next;
      });
    }

    function renderEscope() {
      var boxes = state.eventScopeBoxes;
      if (!boxes.length) {
        return h('div', { key: 'escope', className: 'seg-card' },
          h('div', { className: 'seg-card__lead' }, h(Label, {}, 'Find events where')),
          h('div', { className: 'seg-card__body' },
            h('div', { className: 'seg-group seg-group--empty' },
              h(MenuPopover, {
                renderActivator: function (open) {
                  return h('button', { type: 'button', className: 'seg-add-dim' + (open ? ' seg-add-dim--open' : '') },
                    h(Icon, { name: 'plus', size: 'default', color: open ? 'white' : 'black' }), 'Add dimension');
                },
                renderContent: function (close) {
                  return h(DimensionList, { dims: ALL_DIMENSIONS, close: close, onPick: addEscopeBox });
                },
              }))));
      }
      var body = [];
      boxes.forEach(function (box, bi) {
        if (bi > 0) body.push(h('div', { key: box.id + '-and', className: 'seg-and' }, 'AND'));
        var kids = [h('div', { key: 'lead', className: 'seg-card__lead' }, lead(bi === 0 ? 'Find events' : 'and events', box.id, INCLUDE_EXCLUDE_WHERE))];
        box.groups.forEach(function (rows, gi) {
          if (gi > 0) kids.push(h('div', { key: 'or-' + gi, className: 'seg-or' }, 'OR'));
          kids.push(h(ConditionRow, {
            key: 'row-' + gi,
            row: rows[0],
            dims: ALL_DIMENSIONS,
            onPickDimension: function (dim) { pickDimension(box.id, gi, 0, dim); },
            onChange: function (patch) { patchRow(box.id, gi, 0, patch); },
            onDuplicate: function () { duplicateBoxRow(box.id, gi); },
            onRemove: function () { removeRow(box.id, gi, 0); },
          }));
        });
        // hover pills: "+ OR" adds a row to this box, the last box also offers "+ AND" (a new box)
        kids.push(h('div', { key: 'pills', className: 'seg-pills' },
          pillWithList('or', ALL_DIMENSIONS, function (dim) { addBoxRow(box.id, dim); }),
          bi === boxes.length - 1 ? pillWithList('and', ALL_DIMENSIONS, addEscopeBox) : null));
        body.push(h('div', { key: box.id, className: 'seg-group seg-group--box' + (box.mode === 'exclude' ? ' seg-group--excluded' : '') }, kids));
      });
      return h('div', { key: 'escope', className: 'seg-card' }, h('div', { className: 'seg-card__body' }, body));
    }

    function addDimensionBox(id, dims) {
      return h('div', { key: id + '-empty', className: 'seg-group seg-group--empty' },
        h(MenuPopover, {
          renderActivator: function (open) {
            return h('button', { type: 'button', className: 'seg-add-dim' + (open ? ' seg-add-dim--open' : '') },
              h(Icon, { name: 'plus', size: 'default', color: open ? 'white' : 'black' }), 'Add dimension');
          },
          renderContent: function (close) {
            return h(DimensionList, { dims: dims, close: close, onPick: function (dim) { addFirstDimension(id, dim); } });
          },
        })
      );
    }

    // One card: a sentence-style lead, then its AND/OR groups (or the Add
    // dimension box while it is still empty).
    function blockCard(id, lead, dims, extraClass) {
      var groups = blockGroups(state, id);
      var excluded = blockMode(id) === 'exclude';
      var isEventCard = extraClass === 'seg-card--event';
      return h('div', { key: id, className: 'seg-card' + (extraClass ? ' ' + extraClass : '') + (excluded ? ' seg-card--excluded' : '') },
        h('div', { className: 'seg-card__lead' }, lead),
        h('div', { className: 'seg-card__body' }, groups.length ? renderGroups(id, groups, dims) : [addDimensionBox(id, dims)]),
        // Shown on hover, empty cards included (the zero state is the main group
        // plus one helper event card)
        isEventCard ? h('div', { className: 'seg-card-tools' },
          h('button', {
            type: 'button',
            className: 'seg-card-tool',
            'aria-label': 'Remove event',
            title: state.eventClusters.length > 1 ? 'Remove event' : 'At least one event is required',
            disabled: state.eventClusters.length < 2,
            onClick: function () { removeEventCluster(id); },
          }, h(Icon, { name: 'cross', size: 'small' })),
          h('span', { className: 'seg-card-tools__sep' }),
          h('button', {
            type: 'button',
            className: 'seg-card-tool',
            'aria-label': 'Duplicate event',
            title: 'Duplicate event',
            onClick: function () { duplicateEventCluster(id); },
          }, h(Icon, { name: 'duplicate', size: 'small' }))
        ) : null
      );
    }

    function lead(before, id, options, after) {
      return [
        h(Label, { key: 'before' }, before),
        h(InlineSelect, { key: 'select', label: 'Include or exclude', value: blockMode(id), options: options, onChange: function (mode) { setBlockMode(id, mode); } }),
        after ? h(Label, { key: 'after' }, after) : null,
      ];
    }

    var scope = state.scope;
    var isSession = scope === 'session';
    var info = SCOPE_INFO[scope] || SCOPE_INFO.session;

    var scopePanel = h('div', { key: 'scope', className: 'seg-panel' },
      h('div', { className: 'seg-panel__title' }, h(Label, {}, 'How should conditions be matched?')),
      h(SegmentedSelection, {
        value: scope,
        onChange: set('scope'),
        fullWidth: true,
        equalWidth: true,
        items: [
          { value: 'event', name: 'Event' },
          { value: 'session', name: h('span', { className: 'seg-scope-session' }, 'Session', h(Badge, { text: 'New', color: 'light-blue', size: 'small' })) },
        ],
      }),
      h('div', { className: 'seg-scope-info' },
        h('span', { className: 'seg-icon seg-icon--info', 'aria-hidden': true }),
        h('div', {},
          h('div', { className: 'seg-scope-info__title' }, info.title),
          h('div', { className: 'seg-scope-info__text' }, info.text)
        )
      )
    );

    var conditions;
    if (isSession) {
      // Event cards are AND'd: a divider sits between consecutive cards.
      var eventCards = [];
      state.eventClusters.forEach(function (cluster, idx) {
        if (idx > 0) eventCards.push(h('div', { key: cluster.id + '-and', className: 'seg-and seg-and--events' }, 'AND'));
        eventCards.push(blockCard(cluster.id, lead('that', cluster.id, INCLUDE_EXCLUDE_CONTAIN, idx === 0 ? 'an event where' : 'another event where'), EVENT_DIMENSIONS, 'seg-card--event'));
      });
      conditions = [
        blockCard('session', lead('Find sessions', 'session', INCLUDE_EXCLUDE_WHERE), SESSION_DIMENSIONS),
        h('div', { key: 'events', className: 'seg-events' },
          eventCards,
          h('div', { key: 'add-event', className: 'seg-events__add' },
            h('button', { type: 'button', className: 'seg-link', onClick: addEventCluster },
              h(Icon, { name: 'plus', size: 'small', color: 'blue' }), 'Add another event'))
        ),
      ];
    } else {
      conditions = [renderEscope()];
    }

    function hasCompleteRow(groups) {
      return groups.some(function (rows) { return rows.some(function (row) { return row.dim; }); });
    }
    var hasConditions = isSession
      ? (hasCompleteRow(state.sessionAttrGroups) || state.eventClusters.some(function (c) { return hasCompleteRow(c.groups); }))
      : state.eventScopeBoxes.some(function (b) { return hasCompleteRow(b.groups); });
    var preview = PREVIEW_NUMBERS[scope] || PREVIEW_NUMBERS.session;

    var previewPanel = h('div', { key: 'preview', className: 'seg-panel seg-panel--preview' },
      h('div', { className: 'seg-preview__title' }, 'Visitors from this segment in the last 30 days.'),
      h(Gauge, { value: hasConditions ? preview.pct / 100 : null },
        hasConditions
          ? [
            h('div', { key: 'n', className: 'seg-gauge__number' }, preview.count),
            h('div', { key: 'p', className: 'seg-gauge__sub' }, preview.pct + '% of total'),
            h('div', { key: 't', className: 'seg-gauge__sub' }, preview.total + ' visitors'),
          ]
          : h('div', { className: 'seg-gauge__number seg-gauge__number--empty' }, 'No data'))
    );

    var headerTitle = h('div', { className: 'seg-header-fields' },
      h('input', { className: 'seg-name', type: 'text', placeholder: 'Name', 'aria-label': 'Segment name', value: state.segmentName, onChange: set('segmentName') }),
      h('input', { className: 'seg-desc', type: 'text', placeholder: 'Description', 'aria-label': 'Segment description', value: state.segmentDescription, onChange: set('segmentDescription') })
    );

    var headerRight = h('div', { className: 'seg-header-right' },
      h(VisibilityMenu, { visibility: state.visibility, allSites: state.allSites, onVisibility: set('visibility'), onAllSites: set('allSites') }),
      h('span', { className: 'seg-header-right__divider' }),
      h(Button, { appearance: 'subdued', icon: 'cross', onClick: props.onClose, dataId: 'OverlayView.close' })
    );

    function switchVersion(version) {
      var target = EDITOR_VERSIONS.filter(function (v) { return v.value === version; })[0];
      if (!target || version === APP_VERSION) return;
      var draft = {
        scope: state.scope,
        segmentName: state.segmentName,
        segmentDescription: state.segmentDescription,
        visibility: state.visibility,
        allSites: state.allSites,
        sessionAttrMode: state.sessionAttrMode,
        sessionAttrGroups: state.sessionAttrGroups,
        eventClusters: state.eventClusters,
        eventScopeMode: state.eventScopeMode,
        eventScopeGroups: state.eventScopeGroups,
        eventScopeBoxes: state.eventScopeBoxes,
      };
      if (window.PP_STATIC) {
        try { window.localStorage.setItem('pp_draft', JSON.stringify(draft)); } catch (e) {}
        window.location.href = 'v4/index.html' + window.location.search;
        return;
      }
      var encoded = '#draft=' + encodeURIComponent(JSON.stringify(draft));
      // Behind the gateway (/v3/, /v4/) the other version is a sibling path on the same host;
      // on its own port it is the other port.
      var underGateway = /^(.*\/)v[1-9]\//.exec(window.location.pathname);
      var search = window.location.search; // keeps ?mode=editor
      window.location.href = underGateway
        ? window.location.origin + underGateway[1] + version + '/' + search + encoded
        : window.location.protocol + '//' + window.location.hostname + ':' + target.port + '/' + search + encoded;
    }

    function cleanGroups(groups) {
      return groups.map(function (rows) { return rows.filter(function (row) { return row.dim; }); })
        .filter(function (rows) { return rows.length; });
    }

    // Placeholder rows (no dimension picked yet) and empty extra event cards are
    // dropped on save, so they can never reach the SQL builder.
    function handleSave() {
      var editedValue = props.segment && props.segment.value;
      var name = state.segmentName.trim() || 'Untitled segment';
      var value = (!editedValue || editedValue === 'new')
        ? customSegmentValue(name, props.customSegments)
        : editedValue;
      props.onSave(value, {
        segmentName: name,
        segmentDescription: state.segmentDescription,
        scope: state.scope,
        sessionAttrMode: state.sessionAttrMode,
        sessionAttrGroups: cleanGroups(state.sessionAttrGroups),
        eventClusters: state.eventClusters.map(function (cluster) {
          return Object.assign({}, cluster, { groups: cleanGroups(cluster.groups) });
        }).filter(function (cluster) { return cluster.groups.length; }),
        eventScopeBoxes: state.eventScopeBoxes.map(function (box) {
          return Object.assign({}, box, { groups: cleanGroups(box.groups) });
        }).filter(function (box) { return box.groups.length; }),
      });
    }

    return h(OverlayView, {
      isOpen: true,
      title: headerTitle,
      customCloseButton: headerRight,
      appearance: 'variant2',
    },
      // View wraps the body so it spans the full width (View.Body caps itself at
      // 1280px otherwise); the footer is the floating, pinned Cancel/Save bar.
      h(View, { fullWidth: true },
        h(View.Body, {},
          h('div', { className: 'seg-layout' },
            h('div', { className: 'seg-main' },
              scopePanel,
              h('div', { className: 'seg-section-title' }, h(Label, { type: 'large' }, 'Conditions')),
              conditions
            ),
            h('div', { className: 'seg-aside' }, previewPanel)
          )
        ),
        h(View.Action, { isFloating: true, fullWidth: true },
          h('div', { className: 'seg-bar' },
            h('div', { className: 'seg-bar__actions' },
              h(Button, { text: 'Cancel', appearance: 'default', onClick: props.onClose }),
              h(Button, { text: 'Save', appearance: 'primary', onClick: handleSave })
            )
          )
        )
      )
    );
  }


  // ---------------------------------------------------------------------
  // Floating help button
  // ---------------------------------------------------------------------
  function HelpButton() {
    return h('div', { className: 'help-fab' },
      h(Button, { appearance: 'primary', roundedBorder: true, icon: 'question-mark-circle', badge: '6', onClick: noop })
    );
  }

  // ---------------------------------------------------------------------
  // App root
  // ---------------------------------------------------------------------
  function App() {
    // ?mode=editor: the page is only the builder (used for research sessions), the
    // report behind it is never shown.
    var editorOnly = new URLSearchParams(window.location.search).get('mode') === 'editor';
    var doneState = React.useState(false);
    var savedDone = doneState[0], setSavedDone = doneState[1];
    var freshState = React.useState(0);
    var freshCount = freshState[0], setFreshCount = freshState[1];

    var modalState = React.useState(function () {
      var draft = readDraftFromLocation();
      if (!draft) return editorOnly ? { name: 'New segment', value: 'new' } : null;
      try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
      return { name: 'New segment', value: 'new', draft: draft };
    });
    var editingSegment = modalState[0], setEditingSegment = modalState[1];

    // Segments built in the editor during this session, keyed the same way as
    // SEGMENT_PRESETS so the SQL builder can't tell them apart.
    var customState = React.useState({});
    var customSegments = customState[0], setCustomSegments = customState[1];

    // SegmentPicker2 seeds its internal selection from `selected` on mount only, so
    // after a save (which can rename the selected segment, or add a new one) it has
    // to be remounted or it keeps handing back the pre-edit item.
    var saveCountState = React.useState(0);
    var saveCount = saveCountState[0], setSaveCount = saveCountState[1];

    // SegmentPicker2 (withSelected HOC) keeps its selection and popover in internal
    // state and resets both when `items` changes identity. App re-renders on every
    // query state change, so rebuilding this array inline would close the dropdown
    // mid-click and make the segment editor unreachable.
    var pickerItems = React.useMemo(function () {
      return segmentItems(customSegments);
    }, [customSegments]);

    // Segment comparison mode: SegmentPicker natively supports two slots
    // ([primary, compare]); once both are filled, the report switches to a
    // two-segment comparison view (see ChartSection/DataSection).
    var segmentSelState = React.useState([CONTEXT_BAR_SEGMENTS[0], undefined]);
    var selectedSegments = segmentSelState[0], setSelectedSegments = segmentSelState[1];
    var baseSegment = selectedSegments[0] || CONTEXT_BAR_SEGMENTS[0];
    var compareSegment = selectedSegments[0] && selectedSegments[1] ? selectedSegments[1] : null;

    var report = useReportData(baseSegment, compareSegment, customSegments);

    function handleNewSegment() {
      setEditingSegment({ name: 'New segment', value: 'new' });
    }

    function handleSaveSegment(value, definition) {
      var next = Object.assign({}, customSegments);
      next[value] = definition;
      setCustomSegments(next);
      var saved = { name: definition.segmentName, value: value };
      // Keep the edited segment in whichever slot it already occupied.
      var isCompareSlot = selectedSegments[1] && selectedSegments[1].value === value;
      setSelectedSegments(isCompareSlot
        ? [selectedSegments[0], saved]
        : [saved, selectedSegments[1]]);
      setSaveCount(saveCount + 1);
      setEditingSegment(null);
      if (editorOnly) setSavedDone(true);
    }

    function restartEditor() {
      setSavedDone(false);
      setFreshCount(freshCount + 1);
      setEditingSegment({ name: 'New segment', value: 'new' });
    }

    if (editorOnly) {
      return h(Root, { withThemes: true },
        h('div', { className: 'app-shell app-shell--editor-only' },
          savedDone
            ? h('div', { className: 'editor-done' },
              h('div', { className: 'editor-done__title' }, 'Segment saved'),
              h('div', { className: 'editor-done__text' }, 'Thank you. That is the end of this task.'),
              h(Button, { appearance: 'default', text: 'Start again', onClick: restartEditor }))
            : (editingSegment ? h(SegmentEditorModal, {
              key: 'editor-' + freshCount,
              segment: editingSegment,
              customSegments: customSegments,
              onSave: handleSaveSegment,
              onClose: restartEditor,
            }) : null)
        )
      );
    }

    return h(Root, { withThemes: true },
      h('div', { className: 'app-shell' },
        h(TopBar, {}),
        h(AppNav, {}),
        h(ContextBar, {
          onEditSegment: function (segment) { setEditingSegment(segment); },
          selectedSegments: selectedSegments,
          onSelectedSegmentsChange: setSelectedSegments,
          onManageSegments: handleNewSegment,
          segmentItems: pickerItems,
          pickerVersion: saveCount,
        }),
        h('div', { className: 'app-body' },
          h(Sidebar, {}),
          h('div', { className: 'app-content' },
            h(PageHeader, {}),
            h(ReportStatus, { report: report }),
            h(SegmentScopeNote, { baseSegment: baseSegment, compareSegment: compareSegment, customSegments: customSegments }),
            h(ChartSection, { baseSegment: baseSegment, compareSegment: compareSegment, report: report }),
            h(SubTabs, {}),
            h(DataSection, { baseSegment: baseSegment, compareSegment: compareSegment, report: report })
          )
        ),
        h(HelpButton, {}),
        editingSegment ? h(SegmentEditorModal, {
          segment: editingSegment,
          customSegments: customSegments,
          onSave: handleSaveSegment,
          onClose: function () { setEditingSegment(null); },
        }) : null
      )
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
