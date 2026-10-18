(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const labels = { page_view: 'Page loads', booking_click: 'Booking clicks', scheduler_open: 'Scheduler openings', scheduler_external: 'External-scheduler clicks', phone_click: 'Phone clicks', home: 'Homepage', services: 'Services', evaluation: 'Evaluation', medication: 'Medication management', new_patients: 'New patients', insurance: 'Insurance & payment', telehealth: 'Telehealth', about: 'About', contact: 'Contact', education: 'Education', organic_search: 'Organic search', google_paid: 'Google paid', facebook_paid: 'Facebook paid', facebook_organic: 'Facebook organic', instagram: 'Instagram', referral: 'Other referral', direct_unknown: 'Direct / unknown' };
  let report = null;
  function addRow(body, cells) {
    const row = document.createElement('tr');
    for (const value of cells) { const cell = document.createElement('td'); cell.textContent = String(value); row.appendChild(cell); }
    body.appendChild(row);
  }
  function grouped(dimension, target) {
    const body = $(target); body.replaceChildren();
    const groups = [...new Set(report.rows.map(row => row[dimension]))].sort();
    for (const group of groups) addRow(body, [labels[group] || group, ...['page_view', 'booking_click', 'scheduler_open', 'phone_click'].map(event => report.rows.filter(row => row[dimension] === group && row.event === event).reduce((sum, row) => sum + row.count, 0))]);
  }
  $('report-form').addEventListener('submit', async event => {
    event.preventDefault();
    $('status').textContent = 'Loading…'; $('results').hidden = true; $('export').disabled = true; report = null;
    const params = new URLSearchParams();
    if ($('start').value) params.set('start', $('start').value);
    if ($('end').value) params.set('end', $('end').value);
    const button = event.submitter; if (button) button.disabled = true;
    try {
      const response = await fetch(`/api/growth-report?${params}`, { headers: { Authorization: `Bearer ${$('report-key').value}` }, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load the report.');
      report = data;
      $('period').textContent = `${data.start} through ${data.end} · ${data.timezone}`;
      $('coverage').textContent = data.first_event_day ? `First recorded activity: ${data.first_event_day}. Reports covering that day or earlier may be incomplete.` : 'No activity has been recorded yet. Empty counts do not establish that collection is working.';
      $('totals').replaceChildren();
      for (const action of ['page_view', 'booking_click', 'scheduler_open', 'scheduler_external', 'phone_click']) addRow($('totals'), [labels[action], data.rows.filter(row => row.event === action).reduce((sum, row) => sum + row.count, 0)]);
      grouped('source', 'sources'); grouped('page', 'pages');
      $('limitations').textContent = data.note;
      $('results').hidden = false; $('export').disabled = false; $('status').textContent = data.rows.length ? 'Report loaded.' : 'No recorded events in this period.';
    } catch (error) { $('status').textContent = error.message || 'Could not load the report.'; }
    finally { if (button) button.disabled = false; }
  });
  $('export').addEventListener('click', () => {
    if (!report) return;
    const rows = [['day', 'event', 'page_group', 'source', 'placement', 'count', 'timezone'], ...report.rows.map(row => [row.day, row.event, row.page, row.source, row.placement, row.count, report.timezone])];
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `website-activity-${report.start}-${report.end}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
