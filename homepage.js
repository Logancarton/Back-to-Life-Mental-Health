/* Progressive enhancement: without JavaScript every path stays readable and
   the choices are ordinary in-page links. Selections never leave this page. */
(() => {
  const section = document.querySelector('[data-care-start]');
  if (!section) return;
  const options = section.querySelector('[data-start-options]');
  const tabs = [...section.querySelectorAll('[data-start-tab]')];
  const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));
  if (!options || !tabs.length || panels.some(panel => !panel)) return;

  const select = (index, moveFocus = false) => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (moveFocus) tabs[index].focus();
  };

  options.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener('click', event => {
      // Keep modified link gestures available for visitors who want a new tab.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(index);
    });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (event.key === ' ') next = index;
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });
  const selectFromHash = () => {
    const index = panels.findIndex(panel => `#${panel.id}` === window.location.hash);
    if (index >= 0) select(index);
    return index;
  };
  if (selectFromHash() < 0) select(0);
  window.addEventListener('hashchange', selectFromHash);
  section.classList.add('is-enhanced');
})();
