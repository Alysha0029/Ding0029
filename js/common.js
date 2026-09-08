/* ============================================================
   common.js —— 共享数据层与公共工具函数

   设计思想：
   1. 三个页面（index.html / monthCard.html / addMonthCard.html）
      共用同一份本地数据源，统一使用 localStorage 的 monthCardData
      作为存储 key，实现多页面数据共享与联动更新。
   2. 数据与视图分离：业务数据保存在 JS 数组 / 对象中，页面通过
      渲染函数把数据绘制到 DOM；修改数据后重新调用渲染函数即可。
   3. 本文件只负责「数据存取 + 公共工具」，不含页面渲染逻辑。
   ============================================================ */

/** localStorage 存储 key（需求约定） */
const STORAGE_KEY = 'monthCardData';

/**
 * 从 localStorage 读取月卡数组
 * @returns {Array} 月卡对象数组，无数据时返回空数组
 */
function loadMonthCards() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  try {
    const list = JSON.parse(json);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

/**
 * 将月卡数组序列化后写入 localStorage
 * @param {Array} list 月卡对象数组
 */
function saveMonthCards(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/**
 * 页面初始化：优先读取 localStorage 数据；
 * 本地无数据（key 不存在）时，加载默认模拟数据并写入本地存储。
 * @returns {Array} 初始化后的月卡数组
 */
function initMonthCards() {
  if (localStorage.getItem(STORAGE_KEY) === null) {
    const defaults = getDefaultMonthCards();
    saveMonthCards(defaults);
    return defaults;
  }
  return loadMonthCards();
}

/**
 * 默认模拟月卡数据（首次访问时初始化）
 * 字段说明：plate 车牌 / owner 车主 / phone 手机号 / vehicleType 车辆类型
 *          amount 缴费金额 / startDate 开始日期 / endDate 结束日期
 *          remainDay 剩余有效天数 / status 0可用 1已过期
 */
function getDefaultMonthCards() {
  return [
    { id: 1756656000001, plate: '赣A88888', owner: '张伟', phone: '13800138001', vehicleType: '小型车', amount: 300, startDate: '2026-09-01', endDate: '2026-12-31', remainDay: 121, status: 0 },
    { id: 1756656000002, plate: '粤B12345', owner: '李娜', phone: '13900139002', vehicleType: '中型车', amount: 500, startDate: '2026-08-01', endDate: '2026-08-31', remainDay: 30, status: 1 },
    { id: 1756656000003, plate: '京C66666', owner: '王强', phone: '13700137003', vehicleType: '小型车', amount: 300, startDate: '2026-09-05', endDate: '2026-10-05', remainDay: 30, status: 0 },
    { id: 1756656000004, plate: '沪D88888', owner: '赵敏', phone: '13600136004', vehicleType: '大型车', amount: 800, startDate: '2026-07-01', endDate: '2026-07-31', remainDay: 30, status: 1 },
    { id: 1756656000005, plate: '浙E52000', owner: '刘洋', phone: '13500135005', vehicleType: '小型车', amount: 300, startDate: '2026-09-01', endDate: '2026-11-30', remainDay: 90, status: 0 },
    { id: 1756656000006, plate: '苏F66666', owner: '陈静', phone: '13400134006', vehicleType: '中型车', amount: 500, startDate: '2026-08-15', endDate: '2026-09-15', remainDay: 31, status: 0 }
  ];
}

/**
 * 金额千分位格式化：1286000 -> "1,286,000"
 * @param {number} num
 * @returns {string}
 */
function formatMoney(num) {
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 月卡状态格式化：0 -> "可用"，1 -> "已过期"
 * @param {number} status
 * @returns {string}
 */
function formatStatus(status) {
  return status === 1 ? '已过期' : '可用';
}

/**
 * 手机号正则校验（国内 11 位，1 开头，第二位 3-9）
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 国内车牌正则校验
 * 普通车牌（7位）+ 新能源车牌（8位）：
 *   首位为省份简称，第二位为发牌机关代号字母，
 *   其后 5~6 位字母数字（不含 I、O）。
 * @param {string} plate
 * @returns {boolean}
 */
function isValidPlate(plate) {
  return /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{5,6}$/.test(plate);
}

/**
 * 计算两个日期之间的天数差（end - start）
 * @param {string} startDate 形如 'YYYY-MM-DD'
 * @param {string} endDate 形如 'YYYY-MM-DD'
 * @returns {number} 天数（可能为负）
 */
function calcDays(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

/**
 * 根据结束日期自动判断月卡状态
 * 结束日期早于今天 -> 已过期(1)，否则 -> 可用(0)
 * @param {string} endDate 形如 'YYYY-MM-DD'
 * @returns {number} 0 或 1
 */
function calcStatus(endDate) {
  const end = new Date(endDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today ? 1 : 0;
}

/**
 * 读取 URL 查询参数
 * @param {string} key 参数名
 * @returns {string|null}
 */
function getQueryParam(key) {
  return new URLSearchParams(location.search).get(key);
}

/**
 * 侧边导航公共交互：
 *   1) 整体折叠 / 展开（切换 .collapsed 类）
 *   2) 子菜单展开 / 收起（控制 .submenu 的 display）
 *   3) 根据当前页面文件名高亮对应菜单项
 * 三个页面加载后均调用本函数。
 */
function initSidebar() {
  // 1. 整体折叠
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
    });
  }

  // 2. 子菜单展开 / 收起
  document.querySelectorAll('.menu-group > .menu-title').forEach(function (title) {
    title.addEventListener('click', function () {
      const group = title.parentElement;
      group.classList.toggle('open');
      const sub = group.querySelector('.submenu');
      if (sub) {
        sub.style.display = group.classList.contains('open') ? 'block' : 'none';
      }
    });
  });

  // 3. 当前页面菜单高亮
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.menu-item').forEach(function (item) {
    const target = (item.getAttribute('data-page') || '').toLowerCase();
    if (target === page) item.classList.add('active');
  });
  // 若当前页属于「月卡管理」子菜单，高亮父级标题
  if (page === 'monthcard.html' || page === 'addmonthcard.html') {
    const groupTitle = document.querySelector('.menu-group > .menu-title');
    if (groupTitle) groupTitle.classList.add('active');
  }
}
