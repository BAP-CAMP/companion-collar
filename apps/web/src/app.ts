/** 应用外壳：顶栏（品牌 + 屏切换）与路由宿主。 */
import { mountHomeScreen } from './screens/home.ts';
import { mountDogScreen } from './screens/dog.ts';
import { mountResourcesScreen } from './screens/resources.ts';
import { mountStatusScreen } from './screens/status.ts';
import { mountVitalsScreen } from './screens/vitals.ts';
import { el } from './ui/dom.ts';
import { Router } from './ui/router.ts';

export function mountApp(root: HTMLElement): () => void {
  const nav = el('nav', { class: 'nav', attrs: { 'aria-label': '屏切换' } });
  const topbar = el('header', { class: 'topbar' }, [
    el('div', { class: 'brand' }, [
      el('span', { class: 'brand-dot' }),
      el('span', { class: 'brand-name', text: '项圈 · 伴侣视角' }),
      el('span', { class: 'brand-note', text: '居家样板间' }),
    ]),
    nav,
  ]);

  const host = el('main', { class: 'screen-host' });
  const controls = el('button', { class: 'mobile-controls', text: '场景操作', attrs: { 'aria-expanded': 'false' } });
  root.append(topbar, host, controls);
  const mobile = matchMedia('(max-width: 600px)');
  const closeControls = () => { root.classList.remove('controls-open'); controls.setAttribute('aria-expanded', 'false'); };
  controls.onclick = () => {
    const open = !root.classList.contains('controls-open');
    if (open) host.querySelector<HTMLButtonElement>('.app-dock[data-collapsed="false"] .app-dock-toggle')?.click();
    root.classList.toggle('controls-open', open);
    controls.setAttribute('aria-expanded', String(open));
  };
  const onHostClick = (event: Event) => {
    if (mobile.matches && (event.target as HTMLElement).closest('.app-dock-toggle')) closeControls();
  };
  // A resize into the mobile layout should behave like a fresh mobile visit.
  const onResize = () => {
    if (mobile.matches) host.querySelector<HTMLButtonElement>('.app-dock[data-collapsed="false"] .app-dock-toggle')?.click();
    closeControls();
  };
  host.addEventListener('click', onHostClick);
  mobile.addEventListener('change', onResize);

  const router = new Router(
    [
      { id: 'home', label: '家居场景（猫）', mount: mountHomeScreen },
      // 狗版是**独立一屏**而不是把猫版改掉：两套场景各自成立、可来回对照，
      // 共用的是机制（three + import map + 材质库 + 画质档），分开的是布局与参数。
      { id: 'dog', label: '狗的生活场景', mount: mountDogScreen },
      { id: 'vitals', label: '生理读数', mount: mountVitalsScreen },
      { id: 'resources', label: '居家资源', mount: mountResourcesScreen },
      ...(new URLSearchParams(location.search).has('debug') ? [{ id: 'status', label: '工程自检', mount: mountStatusScreen }] : []),
    ],
    'home',
    host,
    nav,
  );
  router.start();

  return () => {
    mobile.removeEventListener('change', onResize);
    host.removeEventListener('click', onHostClick);
    controls.remove();
    router.dispose();
    topbar.remove();
    host.remove();
  };
}
