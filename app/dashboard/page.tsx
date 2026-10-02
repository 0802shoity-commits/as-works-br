"use client";
import Lottie from "lottie-react";
import contactAnim from "../../public/contact-anim.json";
import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { createClient } from '../lib/supabase';
import { BUSINESS_TYPES } from '../lib/businessTypes';
import UpgradeModal from "../components/UpgradeModal";
import alarmAnim from "../../public/alarm-anim.json";



const COLOR_PALETTE = [
  { bg: "#fce4ec", border: "#e53935" },
  { bg: "#e3f2fd", border: "#1e88e5" },
  { bg: "#fff9c4", border: "#f9a825" },
  { bg: "#e8f5e9", border: "#43a047" },
  { bg: "#fff3e0", border: "#ef6c00" },
];

const INITIAL_WORK_CATEGORIES = [
  {
    category: "カテゴリー1", color: "#c8e6c9", borderColor: "#4caf50",
    items: []
  },
  {
    category: "カテゴリー2", color: "#f8bbd0", borderColor: "#e91e63",
    items: []
  },
  {
    category: "カテゴリー3", color: "#e0f7fa", borderColor: "#4dd0e1",
    items: [
      { title: "項目1", color: "#e0f7fa", borderColor: "#4dd0e1", duration: 45 },
      { title: "項目2", color: "#b2ebf2", borderColor: "#26c6da", duration: 30 },
    ]
  },
];

const DAYS_OF_WEEK = ["日", "月", "火", "水", "木", "金", "土"];

const HOLIDAYS_2026 = [
  "2026-01-01", "2026-01-12", "2026-02-11", "2026-02-23", "2026-03-20",
  "2026-04-29", "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06",
  "2026-07-20", "2026-08-11", "2026-09-21", "2026-09-22", "2026-09-23",
  "2026-10-12", "2026-11-03", "2026-11-23", "2026-12-23"
];

export default function ReservationPage() {
  const [userInitial, setUserInitial] = useState('?');
  const [userName, setUserName] = useState('');
const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [customerReservations, setCustomerReservations] = useState<any[]>([]);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [settings, setSettings] = useState<{
    startHour: number; endHour: number; timeStep: number;
    isCompact: boolean; startDayOfWeek: number; columnWidthScale: number; defaultStaffCount: number;
  }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard_settings');
      if (saved) try { return JSON.parse(saved); } catch {}
    }
    return { startHour: 9, endHour: 19, timeStep: 15, isCompact: false, startDayOfWeek: 0, columnWidthScale: 1.0, defaultStaffCount: 3 };
  });

  const router = useRouter();
  const supabase = createClient();

  const todayStr = useMemo(() => new Date().toLocaleDateString('sv-SE'), []);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [allStaff, setAllStaff] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<{ [date: string]: string[] }>({});
  const [workCategories, setWorkCategories] = useState(INITIAL_WORK_CATEGORIES);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [dayMemo, setDayMemo] = useState<{ [key: string]: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    mode: "range" as "range" | "multiple",
    startDate: todayStr, endDate: todayStr,
    specificDates: [] as string[], startTime: "12:00", endTime: "13:00", selectedDays: [] as number[],
  });
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [addItemForm, setAddItemForm] = useState({ mode: "new" as "new" | "existing", categoryName: "", itemName: "", duration: 60, bgColor: "#f8bbd0", borderColor: "#e91e63" });
  const [tempBgColor, setTempBgColor] = useState("#f8bbd0");
  const [tempBorderColor, setTempBorderColor] = useState("#e91e63");
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    title: "", date: "", staff: "", startTime: "", endTime: "",
    customerName: "", carModel: "", notes: "", phone: "",
    carNumber: "", address: "", inspectionDate: "",
  });
  const [activeAction, setActiveAction] = useState<any | null>(null);
  const [draggingNewType, setDraggingNewType] = useState<string | null>(null);
  const [draggingCategoryItem, setDraggingCategoryItem] = useState<any | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pressedType, setPressedType] = useState<string | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [isSettingView, setIsSettingView] = useState(false);
  const [isDragStarted, setIsDragStarted] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [resizingAppId, setResizingAppId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryForm, setEditCategoryForm] = useState({ name: "", bgColor: "", borderColor: "" });

  // 通知・ヘルプ機能
  const [actionReminderDays, setActionReminderDays] = useState(3);
  const [businessType, setBusinessType] = useState('car');
  const [bookingSlots, setBookingSlots] = useState(2);
  const [notifications, setNotifications] = useState<{ id: string; type: 'action' | 'feedback'; rawId: string | number; title: string; subtitle: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isHelpView, setIsHelpView] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('bug');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [showBookings, setShowBookings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showFeaturePreview, setShowFeaturePreview] = useState(false);
  const [printPaper, setPrintPaper] = useState<'A4' | 'A3'>('A4');
  const printWidthRef = useRef(1040);

  const scrollRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const detailModalRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const lottieWebRef = useRef<any>(null); 

  const SIDE_WIDTH = 150;
  const [timelineHeight, setTimelineHeight] = useState(0);
  const totalHours = useMemo(() => Math.max(1, settings.endHour - settings.startHour + 1), [settings.startHour, settings.endHour]);
 const [COLUMN_WIDTH, setColumnWidth] = useState(100);

  const staffList = useMemo(() => {
    const attending = attendance[selectedDate] || [];
    const remainingSlots = Math.max(0, bookingSlots - attending.length);
    const slotRows: string[] = [];
    for (let i = 0; i < remainingSlots; i++) {
      slotRows.push(`予約枠${i + 1}`);
    }
    const dayApps = appointments.filter(a => a.date === selectedDate);
    const unassigned = dayApps.filter(a => !attending.includes(a.staff) && !slotRows.includes(a.staff));
    const extraStaff = [...new Set(unassigned.map(a => a.staff))].filter(s => !slotRows.includes(s));
    return [...attending, ...slotRows, ...extraStaff];
  }, [attendance, selectedDate, appointments, bookingSlots]);

  // 出勤人数に合わせて、全員が画面に収まる行の高さを計算
  const ROW_HEIGHT = useMemo(() => {
    const max = settings.isCompact ? 45 : 80;
    const min = settings.isCompact ? 32 : 50;
    if (!timelineHeight || staffList.length === 0) return max;
    return Math.max(min, Math.min(max, Math.floor(timelineHeight / staffList.length)));
  }, [timelineHeight, staffList.length, settings.isCompact]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserInitial(user.email?.charAt(0).toUpperCase() || '?');
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
setUserEmail(user.email || '');
      setUserId(user.id);

      const { data: catData } = await supabase.from('work_categories').select('categories').eq('user_id', user.id).single();
      if (catData?.categories) setWorkCategories(catData.categories);
      setCategoriesLoaded(true);

      const { data: staffData } = await supabase.from('staff_members').select('name').eq('user_id', user.id).order('id');
      if (staffData) setAllStaff(staffData.map((s: any) => s.name));

      const { data: planData } = await supabase.from('user_plans').select('plan').eq('user_id', user.id).single();
      setUserPlan(planData?.plan || 'free');

      const { data: settingsData } = await supabase.from('user_settings').select('action_reminder_days, business_type, booking_slots, start_hour, end_hour').eq('user_id', user.id).single();
      if (settingsData?.action_reminder_days != null) setActionReminderDays(settingsData.action_reminder_days);
      if (settingsData?.business_type) setBusinessType(settingsData.business_type);
      if (settingsData?.booking_slots != null) setBookingSlots(settingsData.booking_slots);
if (settingsData?.start_hour != null || settingsData?.end_hour != null) {
  setSettings(prev => {
    const updated = { ...prev, ...(settingsData.start_hour != null ? { startHour: settingsData.start_hour } : {}), ...(settingsData.end_hour != null ? { endHour: settingsData.end_hour } : {}) };
    localStorage.setItem('dashboard_settings', JSON.stringify(updated));
    return updated;
  });
}

      const { data: reservationData } = await supabase.from('customer_reservations').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
      if (reservationData) setCustomerReservations(reservationData);

      const { data: attData } = await supabase.from('staff_attendance').select('*').eq('user_id', user.id);
      if (attData) {
        const attMap: { [date: string]: string[] } = {};
        attData.forEach((a: any) => {
          if (!attMap[a.date]) attMap[a.date] = [];
          attMap[a.date].push(a.staff_name);
        });
        setAttendance(attMap);
      }

      const { data: appData } = await supabase.from('appointments').select('*').eq('user_id', user.id);
      if (appData) {
        setAppointments(appData.map((a: any) => ({
          id: a.id, staff: a.staff, title: a.title, date: a.date,
          start: a.start_time, end: a.end_time,
          customerName: a.customer_name, carModel: a.car_model, notes: a.notes, is_web: a.is_web,
        })));
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!userId || !categoriesLoaded) return;
    const saveCategories = async () => {
      await supabase.from('work_categories').upsert({
        user_id: userId,
        categories: workCategories,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    };
    saveCategories();
  }, [workCategories, userId, categoriesLoaded]);

  useEffect(() => {
    if (!userId) return;
    const fetchNotifications = async () => {
      const todayStr2 = new Date().toLocaleDateString('sv-SE');
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + actionReminderDays);
      const limitStr = limitDate.toLocaleDateString('sv-SE');

      const notifs: { id: string; type: 'action' | 'feedback'; rawId: string | number; title: string; subtitle: string }[] = [];

      const { data: actionsData } = await supabase
        .from('customer_actions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .not('scheduled_date', 'is', null)
        .lte('scheduled_date', limitStr)
        .order('scheduled_date', { ascending: true });

      if (actionsData) {
        actionsData.forEach((a: any) => {
          const diff = Math.floor((new Date(a.scheduled_date).getTime() - new Date(todayStr2).getTime()) / (1000 * 60 * 60 * 24));
          const label = diff < 0 ? '期限切れ' : diff === 0 ? '本日' : `あと${diff}日`;
          notifs.push({ id: `action-${a.id}`, type: 'action', rawId: a.customer_id, title: `🔔 ${a.customer_name}様：${a.action_type}`, subtitle: `${a.scheduled_date}（${label}）` });
        });
      }

      setNotifications(notifs);
    };
    fetchNotifications();
  }, [userId, actionReminderDays]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel('appointments-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` }, (payload: any) => {
        const a = payload.new;
        setAppointments(prev => {
          if (prev.some(app => app.id === a.id)) return prev;
          return [...prev, { id: a.id, staff: a.staff, title: a.title, date: a.date, start: a.start_time, end: a.end_time, customerName: a.customer_name, carModel: a.car_model, notes: a.notes, is_web: a.is_web }];
        });
        if (a.is_web) {
          setTodayBookings(prev => [...prev, { id: a.id, name: a.customer_name, title: a.title, date: a.date, time: `${String(Math.floor(a.start_time / 60)).padStart(2, '0')}:${String(a.start_time % 60).padStart(2, '0')}` }]);
          if (lottieWebRef.current) {
  lottieWebRef.current.goToAndPlay(0);
}
        }
      })
      
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const fetchTodayBookings = async () => {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('customer_reservations')
        .select('id, customer_name, work_type, preferred_date, preferred_time, created_at')
        .eq('owner_id', userId)
        .eq('is_web', true)
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false });
      if (data) {
        setTodayBookings(data.map((r: any) => ({ id: r.id, name: r.customer_name, title: r.work_type, date: r.preferred_date, time: r.preferred_time })));
      }
    };
    fetchTodayBookings();
  }, [userId]);

  useEffect(() => {
    let isPrinting = false;
    const calcWidth = () => {
      if (isPrinting) return;
      if (scrollRef.current) setTimelineHeight(scrollRef.current.clientHeight);
      const available = scrollRef.current?.clientWidth ?? (window.innerWidth - 80);
      setColumnWidth(Math.max(40, ((available - SIDE_WIDTH - 1) / totalHours) * settings.columnWidthScale));
    };
    const beforePrint = () => {
      isPrinting = true;
      // A4横の印刷幅に全時間帯が収まるように列幅を調整
      flushSync(() => setColumnWidth((1040 - SIDE_WIDTH) / totalHours));
    };
    const afterPrint = () => { isPrinting = false; calcWidth(); };
    calcWidth();
    const ro = new ResizeObserver(calcWidth);
    if (scrollRef.current) ro.observe(scrollRef.current);
    window.addEventListener('resize', calcWidth);
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', calcWidth);
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, [totalHours, settings.columnWidthScale]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const handleScroll = () => {
      if (headerScrollRef.current) {
        headerScrollRef.current.scrollLeft = scrollEl.scrollLeft;
      }
    };
    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, []);

  const isOverTrash = useMemo(() => {
    if (!activeAction && !draggingNewType && !draggingCategoryItem) return false;
    if (!trashRef.current) return false;
    const tRect = trashRef.current.getBoundingClientRect();
    return mousePos.x >= tRect.left && mousePos.x <= tRect.right && mousePos.y >= tRect.top && mousePos.y <= tRect.bottom;
  }, [mousePos, activeAction, draggingNewType, draggingCategoryItem]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setShowAccountMenu(false); setIsSettingView(false); setIsHelpView(false); }
    };
    if (showAccountMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAccountMenu]);

  useEffect(() => {
    const handleClickOutsideNotif = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    if (showNotifications) document.addEventListener("mousedown", handleClickOutsideNotif);
    return () => document.removeEventListener("mousedown", handleClickOutsideNotif);
  }, [showNotifications]);

  useEffect(() => {
    const handleClickOutsideBookings = (e: MouseEvent) => {
      const target = e.target as Node;
      const bookingsEl = document.querySelector('[data-bookings-dropdown]');
      if (bookingsEl && !bookingsEl.contains(target)) setShowBookings(false);
    };
    if (showBookings) document.addEventListener("mousedown", handleClickOutsideBookings);
    return () => document.removeEventListener("mousedown", handleClickOutsideBookings);
  }, [showBookings]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (detailModalRef.current && !detailModalRef.current.contains(e.target as Node)) setSelectedAppointment(null);
    };
    if (selectedAppointment) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedAppointment]);

  const filteredAppointments = useMemo(() => appointments.filter(app => app.date === selectedDate), [appointments, selectedDate]);

  const filteredBlocks = useMemo(() => {
    return blockedSlots.filter(b => {
      if (b.specificDates && b.specificDates.includes(selectedDate)) return true;
      if (b.startDate && b.endDate) {
        const current = new Date(selectedDate);
        if (current >= new Date(b.startDate) && current <= new Date(b.endDate)) {
          if (!b.days || b.days.length === 0) return true;
          if (b.days.includes(current.getDay())) return true;
        }
      }
      return false;
    });
  }, [blockedSlots, selectedDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentViewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentViewDate(newDate);
  };

  const toggleAttendance = async (staffName: string) => {
    if (!userId) return;
    const current = attendance[selectedDate] || [];
    const isPresent = current.includes(staffName);
    let newList: string[];
    if (isPresent) {
      await supabase.from('staff_attendance').delete().eq('user_id', userId).eq('date', selectedDate).eq('staff_name', staffName);
      newList = current.filter(s => s !== staffName);
    } else {
      await supabase.from('staff_attendance').insert({ user_id: userId, date: selectedDate, staff_name: staffName });
      newList = [...current, staffName];
    }
    setAttendance(prev => ({ ...prev, [selectedDate]: newList }));
  };

  const addStaff = async () => {
    const name = window.prompt("スタッフ名を入力:");
    if (name?.trim() && userId) {
      await supabase.from('staff_members').insert({ user_id: userId, name: name.trim() });
      setAllStaff(prev => [...prev, name.trim()]);
    }
  };

  const removeStaffFromAll = async (name: string) => {
    if (window.confirm(`${name}さんをスタッフ一覧から削除しますか？`) && userId) {
      await supabase.from('staff_members').delete().eq('user_id', userId).eq('name', name);
      await supabase.from('staff_attendance').delete().eq('user_id', userId).eq('staff_name', name);
      setAllStaff(prev => prev.filter(s => s !== name));
      setAttendance(prev => {
        const newAtt = { ...prev };
        Object.keys(newAtt).forEach(date => { newAtt[date] = newAtt[date].filter(s => s !== name); });
        return newAtt;
      });
    }
  };

  const updateReminderDays = async (days: number) => {
    setActionReminderDays(days);
    if (!userId) return;
    await supabase.from('user_settings').upsert({ user_id: userId, action_reminder_days: days, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  };

  const updateBusinessType = async (type: string) => {
    setBusinessType(type);
    if (!userId) return;
    await supabase.from('user_settings').upsert({ user_id: userId, business_type: type, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  };

  const updateBookingSlots = async (slots: number) => {
    setBookingSlots(slots);
    if (!userId) return;
    await supabase.from('user_settings').upsert({ user_id: userId, booking_slots: slots, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  };

  const markFeedbackRead = async (feedbackId: string) => {
    await supabase.from('feedback_messages').update({ is_read: true }).eq('id', feedbackId);
    setNotifications(prev => prev.filter(n => !(n.type === 'feedback' && n.rawId === feedbackId)));
    setShowNotifications(false);
  };

  const sendFeedback = async () => {
    if (!feedbackTitle.trim() || !feedbackContent.trim()) { alert('タイトルと内容を入力してください'); return; }
    setFeedbackSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    const typeLabel = { bug: '🐛 不具合報告', feature: '🆕 機能の要望', other: '💬 その他' }[feedbackType];
    await supabase.from('feedback_messages').insert({
      user_id: user?.id,
      type: feedbackType,
      title: feedbackTitle,
      content: feedbackContent,
    });
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '1082f8d3-5a20-45fd-b0bf-8c196e30b778',
          subject: `[As-Works] ${typeLabel}: ${feedbackTitle}`,
          from_name: 'As-Works 通知',
          送信者: user?.email || '不明',
          種類: typeLabel,
          タイトル: feedbackTitle,
          内容: feedbackContent,
        }),
      });
    } catch (e) {}
    setFeedbackTitle('');
    setFeedbackContent('');
    setFeedbackSending(false);
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  const addWorkType = () => {
    setIsAddItemModalOpen(true);
    setAddItemForm({ mode: "new", categoryName: "", itemName: "", duration: 60, bgColor: "#f8bbd0", borderColor: "#e91e63" });
    setTempBgColor("#f8bbd0"); setTempBorderColor("#e91e63");
  };

  const saveAddItem = () => {
    if (addItemForm.mode === "new") {
      if (!addItemForm.categoryName.trim() || !addItemForm.itemName.trim()) { alert("カテゴリー名と項目名を入力してください"); return; }
      setWorkCategories(prev => [...prev, { category: addItemForm.categoryName.trim(), color: tempBgColor, borderColor: tempBorderColor, items: [{ title: addItemForm.itemName.trim(), color: tempBgColor, borderColor: tempBorderColor, duration: addItemForm.duration }] }]);
    } else {
      if (!addItemForm.itemName.trim()) { alert("項目名を入力してください"); return; }
      setWorkCategories(prev => prev.map(cat => cat.category === addItemForm.categoryName ? { ...cat, items: [...cat.items, { title: addItemForm.itemName.trim(), color: tempBgColor, borderColor: tempBorderColor, duration: addItemForm.duration }] } : cat));
    }
    setIsAddItemModalOpen(false);
  };

  const saveBlockSetting = () => {
    const [sH, sM] = blockForm.startTime.split(":").map(Number);
    const [eH, eM] = blockForm.endTime.split(":").map(Number);
    const newBlock = { id: Date.now(), startTime: blockForm.startTime, endTime: blockForm.endTime, start: sH * 60 + sM, end: eH * 60 + eM, ...(blockForm.mode === "range" ? { startDate: blockForm.startDate, endDate: blockForm.endDate, days: blockForm.selectedDays } : { specificDates: blockForm.specificDates }) };
    setBlockedSlots(prev => [...prev, newBlock]);
    setIsModalOpen(false);
    setBlockForm({ ...blockForm, specificDates: [], selectedDays: [] });
  };

  const removeBlock = (id: number) => setBlockedSlots(prev => prev.filter(b => b.id !== id));

  const handleColorChange = (e: React.MouseEvent, categoryName: string, itemTitle: string) => {
    e.preventDefault();
    const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    setWorkCategories(prev => prev.map(cat => cat.category === categoryName ? { ...cat, items: cat.items.map(item => item.title === itemTitle ? { ...item, color: randomColor.bg, borderColor: randomColor.border } : item) } : cat));
  };

  const printTimeline = (paper: 'A4' | 'A3') => {
    printWidthRef.current = paper === 'A3' ? 1500 : 1040;
    flushSync(() => setPrintPaper(paper));
    window.print();
    printWidthRef.current = 1040;
    setPrintPaper('A4');
  };

  const formatTime = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

  const openAppointmentDetail = (app: any) => {
    setSelectedAppointment(app);
    setEditForm({ title: app.title, date: app.date, staff: app.staff, startTime: formatTime(app.start), endTime: formatTime(app.end), customerName: app.customerName || "", carModel: app.carModel || "", notes: app.notes || "", phone: app.phone || "", carNumber: app.carNumber || "", address: app.address || "", inspectionDate: app.inspectionDate || "" });
  };

  const saveAppointmentDetail = async () => {
    const [sH, sM] = editForm.startTime.split(":").map(Number);
    const [eH, eM] = editForm.endTime.split(":").map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;
    if (userId) { await supabase.from('appointments').update({ staff: editForm.staff, title: editForm.title, date: editForm.date, start_time: startMins, end_time: endMins, customer_name: editForm.customerName, car_model: editForm.carModel, notes: editForm.notes }).eq('id', selectedAppointment.id); }
    setAppointments(prev => prev.map(app => app.id === selectedAppointment.id ? { ...app, title: editForm.title, date: editForm.date, staff: editForm.staff, start: startMins, end: endMins, customerName: editForm.customerName, carModel: editForm.carModel, notes: editForm.notes, phone: editForm.phone, carNumber: editForm.carNumber, address: editForm.address, inspectionDate: editForm.inspectionDate } : app));
    setSelectedAppointment(null);
  };

  const deleteAppointment = async () => {
    if (window.confirm("この予約を削除しますか？") && userId) { await supabase.from('appointments').delete().eq('id', selectedAppointment.id); setAppointments(prev => prev.filter(app => app.id !== selectedAppointment.id)); setSelectedAppointment(null); }
  };

  const getTimeFromX = useCallback((clientX: number) => {
    if (!scrollRef.current) return settings.startHour * 60;
    const rect = scrollRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left + scrollRef.current.scrollLeft - SIDE_WIDTH;
    const rawMins = settings.startHour * 60 + (relativeX / COLUMN_WIDTH) * 60;
    const mins = Math.round(rawMins / settings.timeStep) * settings.timeStep;
    return Math.max(settings.startHour * 60, Math.min((settings.startHour + totalHours) * 60, mins));
  }, [settings, COLUMN_WIDTH, totalHours]);

  const getStaffFromY = (clientY: number) => {
    if (!scrollRef.current) return "";
    const rect = scrollRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top + scrollRef.current.scrollTop;
    const idx = Math.floor(relativeY / ROW_HEIGHT);
    return staffList[Math.max(0, Math.min(idx, staffList.length - 1))];
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (resizingAppId !== null) { setAppointments(prev => prev.map(app => app.id === resizingAppId ? { ...app, end: Math.max(app.start + settings.timeStep, getTimeFromX(e.clientX)) } : app)); return; }
    if (!activeAction) return;
    if (!isDragStarted) { const distance = Math.sqrt(Math.pow(e.clientX - (activeAction.startX || e.clientX), 2) + Math.pow(e.clientY - (activeAction.startY || e.clientY), 2)); if (distance < 5) return; setIsDragStarted(true); }
    setAppointments(prev => prev.map(app => {
      if (app.id !== activeAction.id || activeAction.type !== "move") return app;
      const duration = app.end - app.start;
      const newStart = Math.round((getTimeFromX(e.clientX) - duration / 2) / settings.timeStep) * settings.timeStep;
      const desiredStaff = getStaffFromY(e.clientY);
      const hasOverlap = (staff: string) => appointments.some(other => other.id !== app.id && other.staff === staff && other.date === app.date && newStart < other.end && newStart + duration > other.start);
      let newStaff = desiredStaff;
      if (hasOverlap(desiredStaff)) { const freeStaff = staffList.find(s => !hasOverlap(s)); if (freeStaff) newStaff = freeStaff; }
      return { ...app, start: newStart, end: newStart + duration, staff: newStaff };
    }));
  };

  const handleMouseUp = async () => {
    setPressedType(null);
    // リサイズ終了 → 終了時刻を保存
    if (resizingAppId !== null) {
      const resized = appointments.find(a => a.id === resizingAppId);
      setResizingAppId(null);
      if (resized && userId) await supabase.from('appointments').update({ end_time: resized.end }).eq('id', resized.id);
      return;
    }
    // 移動終了 → 開始・終了時刻とスタッフを保存
    if (activeAction?.type === "move" && isDragStarted && !isOverTrash && userId) {
      const moved = appointments.find(a => a.id === activeAction.id);
      if (moved) await supabase.from('appointments').update({ start_time: moved.start, end_time: moved.end, staff: moved.staff }).eq('id', moved.id);
    }
    if (isOverTrash) {
      if (activeAction && userId) { await supabase.from('appointments').delete().eq('id', activeAction.id); setAppointments(prev => prev.filter(app => app.id !== activeAction.id)); }
      if (draggingCategoryItem) { if (window.confirm(`「${draggingCategoryItem.itemTitle}」を削除しますか？`)) { setWorkCategories(prev => prev.map(cat => cat.category === draggingCategoryItem.categoryName ? { ...cat, items: cat.items.filter(item => item.title !== draggingCategoryItem.itemTitle) } : cat)); } }
      setActiveAction(null); setDraggingNewType(null); setDraggingCategoryItem(null); setIsDragStarted(false); return;
    }
    if (draggingNewType) {
      const staff = getStaffFromY(mousePos.y);
      if (staff) {
        let duration = 60;
        for (const category of workCategories) { const item = category.items.find(i => i.title === draggingNewType); if (item) { duration = item.duration || 60; break; } }
        const staffApps = appointments.filter(a => a.staff === staff && a.date === selectedDate).sort((a, b) => a.start - b.start);
        let bestStart = Math.floor(getTimeFromX(mousePos.x) / 60) * 60;
        for (const app of staffApps) { if (bestStart >= app.start && bestStart < app.end) bestStart = app.end; }
        for (const app of staffApps) { if (bestStart + duration > app.start && bestStart < app.end) bestStart = app.end; }
        if (bestStart + duration <= settings.endHour * 60) {
          const newApp = { id: Date.now(), staff, start: bestStart, end: bestStart + duration, title: draggingNewType, date: selectedDate, customerName: "", carModel: "", notes: "" };
          if (userId) await supabase.from('appointments').insert({ id: newApp.id, user_id: userId, staff, title: draggingNewType, date: selectedDate, start_time: bestStart, end_time: bestStart + duration, customer_name: "", car_model: "", notes: "" });
          setAppointments(prev => [...prev, newApp]);
        } else { alert('この日の空き時間がありません！'); }
      }
    }
    setDraggingNewType(null); setDraggingCategoryItem(null); setActiveAction(null); setIsDragStarted(false);
  };

  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear(); const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days: (string | null)[] = [];
    const offset = (firstDay - settings.startDayOfWeek + 7) % 7;
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i).toLocaleDateString('sv-SE'));
    return days;
  };

  const isRedDay = (dayStr: string | null) => { if (!dayStr) return false; return new Date(dayStr).getDay() === 0 || HOLIDAYS_2026.includes(dayStr); };

  const displayDaysOfWeek = useMemo(() => { const res = [...DAYS_OF_WEEK]; if (settings.startDayOfWeek === 1) { const sun = res.shift(); if (sun) res.push(sun); } return res; }, [settings.startDayOfWeek]);

  const hexToRgb = (hex: string) => { const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 125, g: 42, b: 232 }; };
  const getGhostColor = () => { if (!draggingCategoryItem) return { bg: "rgba(125, 42, 232, 0.4)", border: "#7d2ae8" }; for (const category of workCategories) { const item = category.items.find(i => i.title === draggingCategoryItem.itemTitle); if (item) { const rgb = hexToRgb(item.color); return { bg: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`, border: item.borderColor }; } } return { bg: "rgba(125, 42, 232, 0.4)", border: "#7d2ae8" }; };

  const headerButtonStyle = { cursor: "pointer", textAlign: "center" as const, display: "flex", flexDirection: "column" as const, alignItems: "center", transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)" };
 // 1. 枠のサイズを 38px → 48px に拡大し、余白のバランスを整えました
const iconCircleStyle = { 
  width: "48px", 
  height: "48px", 
  borderRadius: "10px", // 少し大きくなったので角丸も微調整
  background: "rgba(0,0,0,0.05)", 
  border: "1px solid #ddd", 
  color: "#666", 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center", 
  fontSize: "20px", 
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)", 
  marginBottom: "4px" 
};

// 2. 中の画像を 30px → 40px に拡大しました
const iconImgStyle = { 
  width: "100px", 
  height: "100px", 
  objectFit: "cover" as const, 
  mixBlendMode: "multiply" as const 
};
const subIconImgStyle = { 
  width: "24px",                 // サイズを変更したい場合はここを調整
  height: "24px", 
  objectFit: "cover" as const,   // さっき成功した cover を適用！
  mixBlendMode: "multiply" as const, 
  flexShrink: 0 
};

return (
  <div style={{ height: "100vh", background: "#f8f9fa", display: "flex", flexDirection: "column", overflow: "hidden", userSelect: "none" }} className="dash-root" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&display=swap');
      @media print {
        @page { size: ${printPaper} landscape; margin: 8mm; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { height: auto !important; overflow: visible !important; background: white !important; }
        .dash-root { height: auto !important; overflow: visible !important; background: white !important; }
        [data-no-print] { display: none !important; }
        [data-print-timeline] { margin: 0 !important; flex: none !important; overflow: visible !important; }
        [data-print-timeline] > div { flex: none !important; overflow: visible !important; box-shadow: none !important; }
        [data-print-scroll] { overflow: visible !important; flex: none !important; height: auto !important; }
      }
      @keyframes catOpen { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes catItemIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes notifMarquee {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
      }
    `}</style>
    <div data-no-print style={{ background: "white", padding: "8px 30px", borderBottom: "2px solid #e0e0e0", display: "flex", alignItems: "center", gap: "50px", zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0px", fontSize: "24px", color: "#000000", letterSpacing: "1px", fontFamily: "Arial, sans-serif", fontWeight: "bold", minWidth: "140px", whiteSpace: "nowrap" }}>
  <img src="/awwork.png" alt="As-Works logo" style={{ width: "60px", height: "60px", objectFit: "contain", mixBlendMode: "multiply", marginRight: "-6px" }} />
        -Works
      </div>
      <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
        
        {/* スタッフ追加 */}
        <div onClick={addStaff} style={headerButtonStyle} onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-6px) scale(1.15)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"}>
          <div style={iconCircleStyle}>
            <img src="/shukkin.png" alt="" style={iconImgStyle} />
          </div>
          <div style={{ fontSize: "12px", color: "#333", fontWeight: "600", marginTop: "4px", whiteSpace: "nowrap" }}>
            スタッフ追加
          </div>
        </div>

        {/* 出勤設定 */}
        <div onClick={() => setIsAttendanceModalOpen(true)} style={headerButtonStyle} onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-6px) scale(1.15)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"}>
          <div style={iconCircleStyle}>
            <img src="/karennda.png" alt="" style={iconImgStyle} />
          </div>
          <div style={{ fontSize: "12px", color: "#333", fontWeight: "600", marginTop: "4px", whiteSpace: "nowrap" }}>
            出勤設定
          </div>
        </div>

        {/* 項目追加 */}
        <div onClick={addWorkType} style={headerButtonStyle} onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-6px) scale(1.15)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"}>
          <div style={iconCircleStyle}>
            <img src="/koumoku.png" alt="" style={iconImgStyle} />
          </div>
          <div style={{ fontSize: "12px", color: "#333", fontWeight: "600", marginTop: "4px", whiteSpace: "nowrap" }}>
            項目追加
          </div>
        </div>

        {/* 一括ブロック */}
        <div onClick={() => setIsModalOpen(true)} style={headerButtonStyle} onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-6px) scale(1.15)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"}>
          <div style={iconCircleStyle}>
            <img src="/ikkatuburok.png" alt="" style={iconImgStyle} />
          </div>
          <div style={{ fontSize: "12px", color: "#333", fontWeight: "600", marginTop: "4px", whiteSpace: "nowrap" }}>
            一括ブロック
          </div>
        </div>

        {/* 顧客予約 */}
        <div onClick={() => { if (userPlan !== 'premium') { setShowFeaturePreview(true); return; } router.push('/reservations'); }} style={headerButtonStyle} onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-6px) scale(1.15)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"}>
          {/* 顧客予約のみ、プレミアムプラン判定での特別スタイルがあるためインラインでサイズ調整を適用 */}
          <div style={{ 
            ...iconCircleStyle, 
            width: "48px",
            height: "48px",
            background: userPlan === 'premium' ? "rgba(99, 102, 241, 0.1)" : "rgba(0,0,0,0.05)", 
            border: userPlan === 'premium' ? "1px solid #6366f1" : "1px solid #ddd", 
            color: userPlan === 'premium' ? "#6366f1" : "#999" 
          }}>
            <img src="/kokyakuyoyaku.png" alt="" style={iconImgStyle} />
          </div>
          <div style={{ fontSize: "12px", color: userPlan === 'premium' ? "#333" : "#999", fontWeight: "600", marginTop: "4px" }}>
            顧客予約{userPlan !== 'premium' && "🔒"}
          </div>
        </div>

      

        </div>
        <div style={{ flex: 1 }} />
        <div ref={notifRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #fffbeb, #fef3c7)", boxShadow: "0 2px 8px rgba(245,158,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
  <Lottie
    animationData={alarmAnim}
    loop={notifications.length > 0}
    autoplay={notifications.length > 0}
    style={{ width: "90px", height: "90px" }}
  />
</div>
         <div onClick={() => setShowNotifications(!showNotifications)} style={{ width: "260px", height: "38px", borderRadius: "8px", background: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "1px solid #f59e0b", display: "flex", alignItems: "center", gap: "8px", padding: "0 10px", cursor: "pointer", boxSizing: "border-box" }}>
            <div style={{ flex: 1, overflow: "hidden", position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
              {notifications.length === 0 ? (
                <span style={{ fontSize: "12px", color: "#999" }}>通知はありません</span>
              ) : (
                <div style={{ display: "flex", whiteSpace: "nowrap", animation: `notifMarquee ${Math.max(12, notifications.length * 6)}s linear infinite` }}>
                  {[...notifications, ...notifications].map((n, idx) => (
                    <span key={idx} style={{ marginRight: "40px", fontSize: "12px", color: "#333", fontWeight: "600" }}>{n.title}　{n.subtitle}</span>
                  ))}
                </div>
              )}
            </div>
            {notifications.length > 0 && (<span style={{ flexShrink: 0, background: "#ef4444", color: "white", fontSize: "10px", fontWeight: "bold", borderRadius: "10px", padding: "1px 6px", minWidth: "16px", textAlign: "center", lineHeight: "14px" }}>{notifications.length}</span>)}
          </div>
          {showNotifications && (<div style={{ position: "absolute", top: "46px", right: "0", width: "320px", background: "white", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", border: "1px solid #eee", overflow: "hidden", maxHeight: "360px", overflowY: "auto" }}>
            <div style={{ padding: "12px 15px", fontWeight: "bold", fontSize: "13px", borderBottom: "2px solid #f0f0f0", background: "#fcfcfc" }}>🔔 次回アクション通知</div>
            {notifications.length === 0 ? (<div style={{ padding: "30px 15px", textAlign: "center", color: "#999", fontSize: "12px" }}>通知はありません</div>) : (notifications.map(n => (<div key={n.id} style={{ padding: "12px 15px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: "10px" }}><div onClick={() => { setShowNotifications(false); router.push(`/customers?highlight=${n.rawId}`); }} style={{ flex: 1, cursor: "pointer" }}><div style={{ fontWeight: "bold", marginBottom: "4px", color: "#333", fontSize: "12px" }}>{n.title}</div><div style={{ color: "#888", fontSize: "11px" }}>{n.subtitle}</div></div><button onClick={(e) => { e.stopPropagation(); setNotifications(prev => prev.filter(x => x.id !== n.id)); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#10b981", color: "white", fontSize: "11px", fontWeight: "bold", cursor: "pointer", flexShrink: 0 }}>✓</button></div>)))}
          </div>)}
        </div>
        <div data-bookings-dropdown style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}>
         <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #ede9fe, #ddd6fe)", boxShadow: "0 2px 8px rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
  <Lottie
  lottieRef={lottieWebRef}
  animationData={contactAnim}
  loop={todayBookings.length > 0}
  autoplay={todayBookings.length > 0}
  style={{ width: "90px", height: "90px" }}
/>
</div>
          <div onClick={() => setShowBookings(!showBookings)} style={{ width: "180px", height: "38px", borderRadius: "8px", background: "linear-gradient(135deg, #ede9fe, #ddd6fe)", border: "1px solid #8b5cf6", display: "flex", alignItems: "center", gap: "8px", padding: "0 10px", cursor: "pointer", boxSizing: "border-box" }}>
            <div style={{ flex: 1, overflow: "hidden", position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
  {todayBookings.length === 0 ? (
    <span style={{ fontSize: "12px", color: "#999" }}>本日のWEB予約はありません</span>
  ) : (
    <div style={{ display: "flex", whiteSpace: "nowrap", animation: `notifMarquee ${Math.max(12, todayBookings.length * 6)}s linear infinite` }}>
      {[...todayBookings, ...todayBookings].map((b, idx) => (
        <span key={idx} style={{ marginRight: "40px", fontSize: "12px", color: "#333", fontWeight: "600" }}>📩 {b.name}様 {b.title} {b.date} {b.time}</span>
      ))}
    </div>
  )}
</div>
            {todayBookings.length > 0 && (<span style={{ flexShrink: 0, background: "#6366f1", color: "white", fontSize: "10px", fontWeight: "bold", borderRadius: "10px", padding: "1px 6px", minWidth: "16px", textAlign: "center", lineHeight: "14px" }}>{todayBookings.length}</span>)}
          </div>
          {showBookings && (<div style={{ position: "absolute", top: "46px", right: "0", width: "320px", background: "white", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", border: "1px solid #eee", overflow: "hidden", maxHeight: "360px", overflowY: "auto", zIndex: 200 }}>
            <div style={{ padding: "12px 15px", fontWeight: "bold", fontSize: "13px", borderBottom: "2px solid #f0f0f0", background: "#fcfcfc" }}>📩 本日のWEB予約</div>
            {todayBookings.length === 0 ? (<div style={{ padding: "30px 15px", textAlign: "center", color: "#999", fontSize: "12px" }}>本日のWEB予約はありません</div>) : (todayBookings.map((b, idx) => (<div key={b.id || idx} style={{ padding: "12px 15px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: "10px" }}><div style={{ flex: 1 }}><div style={{ fontWeight: "bold", marginBottom: "4px", color: "#333", fontSize: "13px" }}>👤 {b.name}様</div><div style={{ color: "#555", fontSize: "12px" }}>🔧 {b.title}</div><div style={{ color: "#888", fontSize: "11px" }}>📅 {b.date} {b.time}</div></div><button onClick={(e) => { e.stopPropagation(); const removeId = b.id; setTodayBookings(prev => prev.filter(x => x.id !== removeId)); }}style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#10b981", color: "white", fontSize: "11px", fontWeight: "bold", cursor: "pointer", flexShrink: 0 }}>✓</button></div>)))}
          </div>)}
        </div>
        <div ref={menuRef} style={{ position: "relative" }}>
          <div onClick={() => setShowAccountMenu(!showAccountMenu)} style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", cursor: "pointer" }}>{userInitial}</div>
          {showAccountMenu && (<div style={{ position: "absolute", top: "50px", right: "0", width: isHelpView ? "320px" : "260px", background: "white", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", border: "1px solid #eee", overflow: "hidden" }}>{!isSettingView ? (<><div style={{ padding: "15px", background: "#fcfcfc", borderBottom: "2px solid #e0e0e0" }}><div style={{ fontWeight: "bold", fontSize: "14px" }}>{userName}</div>
<div style={{ fontSize: "11px", color: "#888" }}>{userEmail}</div></div><div style={{ padding: "5px 0" }}><div onClick={() => { if (userPlan === 'premium') { alert('✅ プレミアム会員済みです'); setShowAccountMenu(false); } else { setShowUpgrade(true); setShowAccountMenu(false); } }} style={{ padding: "10px 15px", cursor: "pointer", fontSize: "13px" }}>⭐ 有料プラン {userPlan === 'premium' && <span style={{ fontSize: "11px", color: "#10b981", marginLeft: "4px" }}>✅ 加入中</span>}</div><div onClick={() => setIsSettingView(true)} style={{ padding: "10px 15px", cursor: "pointer", fontSize: "13px" }}>⚙️ 設定</div>
<div onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} style={{ padding: "10px 15px", cursor: "pointer", fontSize: "13px", color: "#ff5252" }}>🚪 ログアウト</div></div></>) : (<><div style={{ padding: "10px 15px", background: "#f3e8ff", borderBottom: "2px solid #e0e0e0", display: "flex", alignItems: "center", gap: "10px" }}><span onClick={() => { if (isHelpView) setIsHelpView(false); else setIsSettingView(false); }} style={{ cursor: "pointer", fontSize: "16px" }}>←</span><div style={{ fontWeight: "bold", fontSize: "13px" }}>{isHelpView ? "ヘルプ・お問い合わせ" : "システム設定"}</div></div><div style={{ padding: "15px", display: "flex", flexDirection: "column", gap: "15px", maxHeight: "500px", overflowY: "auto" }}>{!isHelpView ? (<><div><div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>受付時間</div><div style={{ display: "flex", alignItems: "center", gap: "5px" }}><input type="number" value={settings.startHour} onChange={e => { const v = Number(e.target.value); const updated = { ...settings, startHour: v }; setSettings(updated); localStorage.setItem('dashboard_settings', JSON.stringify(updated)); if (userId) supabase.from('user_settings').update({ start_hour: v, updated_at: new Date().toISOString() }).eq('user_id', userId); }} style={{ width: "50px", padding: "4px", border: "2px solid #d0d0d0", borderRadius: "4px" }} /><span style={{ fontSize: "12px" }}>時 〜</span><input type="number" value={settings.endHour} onChange={e => { const v = Number(e.target.value); const updated = { ...settings, endHour: v }; setSettings(updated); localStorage.setItem('dashboard_settings', JSON.stringify(updated)); if (userId) supabase.from('user_settings').update({ end_hour: v, updated_at: new Date().toISOString() }).eq('user_id', userId); }} style={{ width: "50px", padding: "4px", border: "2px solid #d0d0d0", borderRadius: "4px" }} /><span style={{ fontSize: "12px" }}>時</span></div></div><div><div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>時間単位 (スナップ)</div><select value={settings.timeStep} onChange={e => setSettings({ ...settings, timeStep: Number(e.target.value) })} style={{ width: "100%", padding: "5px", border: "2px solid #d0d0d0", borderRadius: "4px", fontSize: "12px" }}><option value={15}>15分単位</option><option value={30}>30分単位</option><option value={60}>60分単位</option></select></div><div><div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>カレンダー開始曜日</div><select value={settings.startDayOfWeek} onChange={e => setSettings({ ...settings, startDayOfWeek: Number(e.target.value) })} style={{ width: "100%", padding: "5px", border: "2px solid #d0d0d0", borderRadius: "4px", fontSize: "12px" }}><option value={0}>日曜日はじまり</option><option value={1}>月曜日はじまり</option></select></div><div><div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>タイムラインの幅 (ズーム)</div><input type="range" min="0.5" max="2.0" step="0.1" value={settings.columnWidthScale} onChange={e => setSettings({ ...settings, columnWidthScale: Number(e.target.value) })} style={{ width: "100%" }} /></div><label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}><input type="checkbox" checked={settings.isCompact} onChange={e => setSettings({ ...settings, isCompact: e.target.checked })} />コンパクトモード</label><div><div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>スタッフ管理</div>{allStaff.map((staff, idx) => (<div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}><span style={{ flex: 1, fontSize: "12px" }}>{staff}</span><span onClick={() => removeStaffFromAll(staff)} style={{ color: "#ff5252", cursor: "pointer", fontSize: "14px" }}>×</span></div>))}</div>
<div>
  <div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>次回アクション通知</div>
  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
    <span>期日の</span>
    <input type="number" min="0" value={actionReminderDays} onChange={e => updateReminderDays(Number(e.target.value))} style={{ width: "50px", padding: "4px", border: "2px solid #d0d0d0", borderRadius: "4px" }} />
    <span>日前から通知する</span>
  </div>
</div>
<div>
  <div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>WEB予約の同時受付枠数</div>
  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
    <input type="number" min="1" max="20" value={bookingSlots} onChange={e => updateBookingSlots(Number(e.target.value))} style={{ width: "50px", padding: "4px", border: "2px solid #d0d0d0", borderRadius: "4px" }} />
    <span>枠（同時に受付可能な予約数）</span>
  </div>
</div>

<div onClick={() => setIsHelpView(true)} style={{ padding: "10px", textAlign: "center", borderRadius: "8px", border: "2px solid #6366f1", color: "#6366f1", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>📩 ヘルプ・お問い合わせ</div>
<div onClick={async () => {
  const input = window.prompt("本当に退会しますか？\n\n・すべてのデータが削除されます\n・この操作は取り消せません\n\n確認のため「退会」と入力してください：");
  if (input !== "退会") { if (input !== null) alert("入力が一致しません。"); return; }
  if (!userId) return;
  try {
    await supabase.from('appointments').delete().eq('user_id', userId);
    await supabase.from('staff_attendance').delete().eq('user_id', userId);
    await supabase.from('staff_members').delete().eq('user_id', userId);
    await supabase.from('work_categories').delete().eq('user_id', userId);
    await supabase.from('user_plans').delete().eq('user_id', userId);
    await supabase.from('user_settings').delete().eq('user_id', userId);
    await supabase.from('customers').delete().eq('user_id', userId);
    await supabase.from('customer_actions').delete().eq('user_id', userId);
    await supabase.from('customer_action_logs').delete().eq('user_id', userId);
    await supabase.from('customer_reservations').delete().eq('owner_id', userId);
    await supabase.from('customer_work_history').delete().eq('user_id', userId);
    await supabase.from('feedback_messages').delete().eq('user_id', userId);
    await supabase.from('blocked_slots').delete().eq('user_id', userId);
    await supabase.from('calendar_events').delete().eq('user_id', userId);
    await supabase.from('shift_data').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.auth.signOut();
    router.push('/');
  } catch (e) {
    alert('退会処理中にエラーが発生しました。サポートまでお問い合わせください。');
  }
}} style={{ padding: "10px", textAlign: "center", borderRadius: "8px", border: "2px solid #ef4444", color: "#ef4444", cursor: "pointer", fontSize: "13px", fontWeight: "bold", marginTop: "8px" }}>⚠️ 退会する</div>
</>) : (<>
<div style={{ fontSize: "12px", color: "#888" }}>不具合・ご要望はこちらから送信できます。内容は開発者に通知されます。</div>
<div>
  <div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>種類</div>
  <select value={feedbackType} onChange={e => setFeedbackType(e.target.value as any)} style={{ width: "100%", padding: "6px", border: "2px solid #d0d0d0", borderRadius: "4px", fontSize: "12px" }}>
    <option value="bug">🐛 不具合報告</option>
    <option value="feature">🆕 機能の要望</option>
    <option value="other">💬 その他</option>
  </select>
</div>
<div>
  <div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>タイトル</div>
  <input value={feedbackTitle} onChange={e => setFeedbackTitle(e.target.value)} placeholder="例：保存ができない" style={{ width: "100%", padding: "6px", border: "2px solid #d0d0d0", borderRadius: "4px", fontSize: "12px", boxSizing: "border-box" }} />
</div>
<div>
  <div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>詳細内容</div>
  <textarea value={feedbackContent} onChange={e => setFeedbackContent(e.target.value)} placeholder="状況や希望を入力してください" style={{ width: "100%", padding: "6px", border: "2px solid #d0d0d0", borderRadius: "4px", fontSize: "12px", boxSizing: "border-box", minHeight: "70px", fontFamily: "inherit" }} />
</div>
<button onClick={sendFeedback} disabled={feedbackSending} style={{ padding: "10px", borderRadius: "8px", border: "none", background: feedbackSending ? "#ccc" : "#6366f1", color: "white", cursor: feedbackSending ? "default" : "pointer", fontSize: "13px", fontWeight: "bold" }}>{feedbackSending ? "送信中..." : "📨 送信する"}</button>
{feedbackSent && <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "bold", textAlign: "center" }}>✓ 送信しました</div>}
</>)}</div></>)}</div>)}
        </div>
      </div>

      {isAttendanceModalOpen && (<div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: "400px", background: "white", borderRadius: "16px", padding: "25px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}><div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}><span>出勤設定</span><span onClick={() => setIsAttendanceModalOpen(false)} style={{ cursor: "pointer", color: "#ccc" }}>×</span></div><div style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>{selectedDate} の出勤スタッフを選択</div>{allStaff.length === 0 ? (<div style={{ textAlign: "center", color: "#999", padding: "20px" }}>スタッフが登録されていません</div>) : (allStaff.map(staff => { const isPresent = (attendance[selectedDate] || []).includes(staff); return (<div key={staff} onClick={() => toggleAttendance(staff)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", marginBottom: "8px", borderRadius: "8px", border: `2px solid ${isPresent ? "#6366f1" : "#e5e7eb"}`, background: isPresent ? "#f0f0ff" : "white", cursor: "pointer" }}><div style={{ width: "24px", height: "24px", borderRadius: "50%", background: isPresent ? "#6366f1" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px" }}>{isPresent ? "✓" : ""}</div><span style={{ fontSize: "14px", fontWeight: isPresent ? "bold" : "normal" }}>{staff}</span><span style={{ marginLeft: "auto", fontSize: "12px", color: isPresent ? "#6366f1" : "#999" }}>{isPresent ? "出勤" : "休み"}</span></div>); }))}<button onClick={() => setIsAttendanceModalOpen(false)} style={{ width: "100%", padding: "12px", marginTop: "10px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #1a1a2e, #0f3460)", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>完了</button></div></div>)}

      {isAddItemModalOpen && (<div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: "480px", background: "white", borderRadius: "16px", padding: "25px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}><div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px", display: "flex", justifyContent: "space-between" }}><span>項目追加</span><span onClick={() => setIsAddItemModalOpen(false)} style={{ cursor: "pointer", color: "#ccc" }}>×</span></div><div style={{ display: "flex", background: "#f0f0f0", borderRadius: "8px", padding: "4px", marginBottom: "20px" }}><div onClick={() => setAddItemForm({ ...addItemForm, mode: "new" })} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", background: addItemForm.mode === "new" ? "white" : "transparent", fontWeight: addItemForm.mode === "new" ? "bold" : "normal" }}>新規カテゴリ</div><div onClick={() => setAddItemForm({ ...addItemForm, mode: "existing" })} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", background: addItemForm.mode === "existing" ? "white" : "transparent", fontWeight: addItemForm.mode === "existing" ? "bold" : "normal" }}>既存に追加</div></div>{addItemForm.mode === "new" ? (<><div style={{ marginBottom: "15px" }}><div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>カテゴリー名</div><input type="text" value={addItemForm.categoryName} onChange={e => setAddItemForm({ ...addItemForm, categoryName: e.target.value })} placeholder="例: 点検" style={{ width: "100%", padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} /></div><div style={{ marginBottom: "15px" }}><div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>項目名</div><input type="text" value={addItemForm.itemName} onChange={e => setAddItemForm({ ...addItemForm, itemName: e.target.value })} placeholder="例: エンジン点検" style={{ width: "100%", padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} /></div></>) : (<><div style={{ marginBottom: "15px" }}><div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>カテゴリーを選択</div><select value={addItemForm.categoryName} onChange={e => setAddItemForm({ ...addItemForm, categoryName: e.target.value })} style={{ width: "100%", padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}><option value="">選択してください</option>{workCategories.map(cat => <option key={cat.category} value={cat.category}>{cat.category}</option>)}</select></div><div style={{ marginBottom: "15px" }}><div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>項目名</div><input type="text" value={addItemForm.itemName} onChange={e => setAddItemForm({ ...addItemForm, itemName: e.target.value })} placeholder="例: 中古部品交換" style={{ width: "100%", padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} /></div></>)}<div style={{ marginBottom: "15px" }}><div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>作業時間（分）</div><input type="number" value={addItemForm.duration} onChange={e => setAddItemForm({ ...addItemForm, duration: Number(e.target.value) })} min="5" step="5" style={{ width: "100%", padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} /></div><div style={{ marginBottom: "20px" }}><div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>色を選択</div><div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}><div style={{ flex: 1 }}><div style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>背景色</div><input type="color" value={tempBgColor} onChange={e => setTempBgColor(e.target.value)} style={{ width: "100%", height: "40px", border: "2px solid #d0d0d0", borderRadius: "6px", cursor: "pointer", padding: "2px" }} /></div><div style={{ flex: 1 }}><div style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>枠線色</div><input type="color" value={tempBorderColor} onChange={e => setTempBorderColor(e.target.value)} style={{ width: "100%", height: "40px", border: "2px solid #d0d0d0", borderRadius: "6px", cursor: "pointer", padding: "2px" }} /></div><div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}><div style={{ width: "100%", height: "40px", background: tempBgColor, border: `3px solid ${tempBorderColor}`, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" }}>プレビュー</div></div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>{COLOR_PALETTE.map((color, idx) => (<div key={idx} onClick={() => { setTempBgColor(color.bg); setTempBorderColor(color.border); }} style={{ width: "100%", height: "50px", background: color.bg, border: tempBgColor === color.bg ? `4px solid ${color.border}` : `2px solid ${color.border}`, borderRadius: "6px", cursor: "pointer" }} />))}</div></div><div style={{ display: "flex", gap: "10px" }}><button onClick={() => setIsAddItemModalOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid #d0d0d0", background: "white", cursor: "pointer" }}>キャンセル</button><button onClick={saveAddItem} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#7d2ae8", color: "white", cursor: "pointer", fontWeight: "bold" }}>追加</button></div></div></div>)}

      {selectedAppointment && (<div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedAppointment(null)}><div ref={detailModalRef} style={{ width: "520px", background: "white", borderRadius: "16px", padding: "25px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}><div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px", display: "flex", justifyContent: "space-between" }}><span>予約詳細</span><span onClick={() => setSelectedAppointment(null)} style={{ cursor: "pointer", color: "#ccc" }}>×</span></div><div style={{ marginBottom: "15px" }}><div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>予約項目</div><div style={{ fontSize: "15px", fontWeight: "bold", color: "#333", padding: "10px", background: "#f5f5f5", borderRadius: "6px", border: "2px solid #d0d0d0" }}>{editForm.title}</div></div>{[{ label: "お客様名", key: "customerName", placeholder: "お客様名を入力", type: "text" },{ label: "電話番号", key: "phone", placeholder: "090-0000-0000", type: "tel" },{ label: "その他", key: "carModel", placeholder: "メモを入力", type: "text" }].map(({ label, key, placeholder, type }) => (<div key={key} style={{ marginBottom: "15px" }}><div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>{label}</div><input type={type} value={editForm[key as keyof typeof editForm]} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })} placeholder={placeholder} style={{ width: "100%", padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} /></div>))}<div style={{ marginBottom: "15px" }}><div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>日付</div><input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} style={{ width: "100%", padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} /></div><div style={{ marginBottom: "15px" }}><div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>スタッフ</div><input type="text" value={editForm.staff} onChange={e => setEditForm({ ...editForm, staff: e.target.value })} placeholder="スタッフ名を入力" style={{ width: "100%", padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} /></div><div style={{ marginBottom: "15px" }}><div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>時間</div><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><input type="time" value={editForm.startTime} onChange={e => setEditForm({ ...editForm, startTime: e.target.value })} style={{ flex: 1, padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} /><span>〜</span><input type="time" value={editForm.endTime} onChange={e => setEditForm({ ...editForm, endTime: e.target.value })} style={{ flex: 1, padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} /></div></div><div style={{ marginBottom: "15px" }}><div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>備考</div><textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder="備考を入力" style={{ width: "100%", padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", minHeight: "80px", fontFamily: "inherit" }} /></div><div style={{ display: "flex", gap: "10px", marginTop: "25px" }}><button onClick={() => setSelectedAppointment(null)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid #d0d0d0", background: "white", cursor: "pointer", fontSize: "13px" }}>キャンセル</button>{userPlan === 'premium' && <button onClick={() => { const params = new URLSearchParams({ name: editForm.customerName || '', phone: editForm.phone || '', carModel: editForm.carModel || '', workType: editForm.title || '', workDate: editForm.date || '', notes: editForm.notes || '' }); router.push(`/customer-register?${params.toString()}`); }} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#10b981", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>👤 顧客登録</button>}<button onClick={deleteAppointment} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid #ff5252", background: "white", color: "#ff5252", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>削除</button><button onClick={saveAppointmentDetail} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#7d2ae8", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>保存</button></div></div></div>)}

      {isModalOpen && (<div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: "480px", background: "white", borderRadius: "16px", padding: "25px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}><div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px", display: "flex", justifyContent: "space-between" }}><span>予約不可設定</span><span onClick={() => setIsModalOpen(false)} style={{ cursor: "pointer", color: "#ccc" }}>×</span></div><div style={{ display: "flex", background: "#f0f0f0", borderRadius: "8px", padding: "4px", marginBottom: "20px" }}><div onClick={() => setBlockForm({ ...blockForm, mode: "range" })} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", background: blockForm.mode === "range" ? "white" : "transparent", fontWeight: blockForm.mode === "range" ? "bold" : "normal" }}>期間で指定</div><div onClick={() => setBlockForm({ ...blockForm, mode: "multiple" })} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", background: blockForm.mode === "multiple" ? "white" : "transparent", fontWeight: blockForm.mode === "multiple" ? "bold" : "normal" }}>とびとびで指定</div></div><div style={{ marginBottom: "20px" }}><div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>日程を選択</div>{blockForm.mode === "range" ? (<div style={{ display: "flex", alignItems: "center", gap: "10px" }}><input type="date" value={blockForm.startDate} onChange={e => setBlockForm({ ...blockForm, startDate: e.target.value })} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "2px solid #d0d0d0" }} /><span>〜</span><input type="date" value={blockForm.endDate} onChange={e => setBlockForm({ ...blockForm, endDate: e.target.value })} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "2px solid #d0d0d0" }} /></div>) : (<div><input type="date" onChange={e => { if (e.target.value && !blockForm.specificDates.includes(e.target.value)) setBlockForm({ ...blockForm, specificDates: [...blockForm.specificDates, e.target.value] }); }} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "2px solid #d0d0d0", marginBottom: "10px" }} /><div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{blockForm.specificDates.map(d => (<div key={d} style={{ background: "#f3e8ff", color: "#7d2ae8", padding: "4px 10px", borderRadius: "15px", fontSize: "11px", display: "flex", alignItems: "center", gap: "5px" }}>{d} <span onClick={() => setBlockForm({ ...blockForm, specificDates: blockForm.specificDates.filter(date => date !== d) })} style={{ cursor: "pointer" }}>×</span></div>))}</div></div>)}</div><div style={{ marginBottom: "20px" }}><div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>時間帯を選択</div><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><input type="time" value={blockForm.startTime} onChange={e => setBlockForm({ ...blockForm, startTime: e.target.value })} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "2px solid #d0d0d0" }} /><span>〜</span><input type="time" value={blockForm.endTime} onChange={e => setBlockForm({ ...blockForm, endTime: e.target.value })} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "2px solid #d0d0d0" }} /></div></div>{blockForm.mode === "range" && (<div style={{ marginBottom: "25px" }}><div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>特定の曜日のみ (任意)</div><div style={{ display: "flex", gap: "5px" }}>{DAYS_OF_WEEK.map((day, idx) => (<div key={day} onClick={() => { const newDays = blockForm.selectedDays.includes(idx) ? blockForm.selectedDays.filter(d => d !== idx) : [...blockForm.selectedDays, idx]; setBlockForm({ ...blockForm, selectedDays: newDays }); }} style={{ flex: 1, height: "35px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", cursor: "pointer", fontSize: "12px", background: blockForm.selectedDays.includes(idx) ? "#7d2ae8" : "#f0f0f0", color: blockForm.selectedDays.includes(idx) ? "white" : "#333", border: blockForm.selectedDays.includes(idx) ? "2px solid #7d2ae8" : "2px solid #d0d0d0" }}>{day}</div>))}</div></div>)}<div style={{ display: "flex", gap: "10px" }}><button onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid #d0d0d0", background: "white", cursor: "pointer" }}>キャンセル</button><button onClick={saveBlockSetting} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#7d2ae8", color: "white", cursor: "pointer", fontWeight: "bold" }}>設定を保存</button></div></div></div>)}

      <div data-no-print style={{ margin: "15px 20px", background: "white", borderRadius: "12px", padding: "15px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", gap: "20px", height: "240px", border: "2px solid #e8e8e8" }}>
        <div style={{ flex: 1, display: "flex", gap: "10px", borderRight: "3px solid #d0d0d0", paddingRight: "15px", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <button onClick={() => changeMonth(-1)} style={{ background: "none", border: "2px solid #d0d0d0", borderRadius: "4px", padding: "5px", flexShrink: 0 }}>◀</button>
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "8px", letterSpacing: "2px", fontFamily: "'Montserrat', sans-serif", color: "#1a1a2e" }}>{currentViewDate.getFullYear()} / {currentViewDate.getMonth() + 1}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", border: "2px solid #d0d0d0", background: "#fcfcfc", width: "100%" }}>
              {displayDaysOfWeek.map((day, i) => (<div key={i} style={{ height: "28px", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", borderBottom: "2px solid #d0d0d0", color: (settings.startDayOfWeek === 0 ? i === 0 : i === 6) ? "#ff5252" : "#666" }}>{day}</div>))}
              {getCalendarDays(currentViewDate).map((dayStr, i) => (<div key={i} onClick={() => dayStr && setSelectedDate(dayStr)} style={{ height: "28px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", cursor: dayStr ? "pointer" : "default", background: dayStr === selectedDate ? "#7d2ae8" : "white", color: dayStr === selectedDate ? "white" : (isRedDay(dayStr) ? "#ff5252" : "#333"), border: "1px solid #d0d0d0" }}>{dayStr ? new Date(dayStr).getDate() : ""}</div>))}
            </div>
          </div>
          <button onClick={() => changeMonth(1)} style={{ background: "none", border: "2px solid #d0d0d0", borderRadius: "4px", padding: "5px", flexShrink: 0 }}>▶</button>
        </div>

        <div style={{ flex: 1, borderRight: "3px solid #d0d0d0", paddingRight: "15px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1a1a2e", fontFamily: "'Montserrat', sans-serif", letterSpacing: "1px" }}>📝 {selectedDate} のメモ</div>
          <textarea value={dayMemo[selectedDate] || ""} onChange={e => setDayMemo(prev => ({ ...prev, [selectedDate]: e.target.value }))} placeholder="この日のメモを入力..." style={{ flex: 1, padding: "10px", border: "2px solid #d0d0d0", borderRadius: "8px", fontSize: "12px", resize: "none", fontFamily: "inherit", outline: "none", lineHeight: "1.6" }} />
          <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", color: "white", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: "bold", textAlign: "center" }}>📅 本日の予約: {filteredAppointments.filter(a => staffList.includes(a.staff) && a.title !== "ブロック").length}件</div>
        </div>

                       <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", minWidth: 0 }}>
          {(() => {
            const openCat = workCategories.find(c => c.category === expandedCategory);
            const tileBase = { position: "relative" as const, aspectRatio: "1 / 1", borderRadius: "10px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "6px", textAlign: "center" as const, boxSizing: "border-box" as const, transition: "transform 0.2s ease, box-shadow 0.2s ease" };
            const hoverOn = (e: React.MouseEvent) => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-3px) scale(1.03)"; el.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)"; };
            const hoverOff = (e: React.MouseEvent) => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = "none"; };
            const viewStyle = { display: "flex", flexDirection: "column" as const, flex: 1, minHeight: 0, animation: "catOpen 0.4s cubic-bezier(0.22, 1, 0.36, 1)" };
            const itemAnim = (idx: number) => ({ animation: `catItemIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.04}s both` });

            // カテゴリー一覧（正方形タイル）
            if (!openCat) {
              return (
                <div key="cat-list" style={viewStyle}>
                  <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px", color: "#333" }}>
                    ドラッグして追加 <span style={{ fontWeight: "normal", color: "#999", fontSize: "11px" }}>（タップで開く）</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", alignContent: "start", flex: 1, overflowY: "auto", padding: "6px" }}>
                    {workCategories.map((category, idx) => (
                      <div key={category.category} onClick={() => setExpandedCategory(category.category)} onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                        style={{ ...tileBase, ...itemAnim(idx), background: category.color, border: `3px solid ${category.borderColor}`, cursor: "pointer" }}>
                        <div style={{ fontWeight: "bold", fontSize: "12px", lineHeight: 1.3, wordBreak: "break-all", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{category.category}</div>
                        <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>{category.items.length}項目</div>
                        <div onClick={(e) => { e.stopPropagation(); setEditingCategory(category.category); setEditCategoryForm({ name: category.category, bgColor: category.color, borderColor: category.borderColor }); }}
                          style={{ position: "absolute", top: "4px", right: "4px", width: "20px", height: "20px", borderRadius: "50%", background: category.borderColor, color: "white", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✎</div>
                      </div>
                    ))}

                    {/* ブロック（ドラッグで追加） */}
                    <div
                      onMouseDown={() => { setDraggingNewType("ブロック"); setDraggingCategoryItem({ categoryName: "ブロック", itemTitle: "ブロック" }); setPressedType("ブロック"); }}
                      onMouseUp={() => { setDraggingNewType(null); setDraggingCategoryItem(null); }}
                      onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                      style={{ ...tileBase, ...itemAnim(workCategories.length), background: "#d1d5db", border: "3px solid #6b7280", cursor: "grab", color: "#333" }}>
                      <div style={{ fontSize: "18px" }}>🚫</div>
                      <div style={{ fontWeight: "bold", fontSize: "12px", marginTop: "2px" }}>ブロック</div>
                      <div style={{ fontSize: "9px", color: "#555" }}>ドラッグ</div>
                    </div>

                    {/* カテゴリー追加 */}
                    <div onClick={addWorkType} onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                      style={{ ...tileBase, ...itemAnim(workCategories.length + 1), background: "white", border: "3px dashed #c0c0c0", cursor: "pointer", color: "#888" }}>
                      <div style={{ fontSize: "22px", lineHeight: 1 }}>＋</div>
                      <div style={{ fontWeight: "bold", fontSize: "11px", marginTop: "4px" }}>追加</div>
                    </div>
                  </div>
                </div>
              );
            }

            // カテゴリーを開いた状態（ここだけスクロール可）
            return (
              <div key={`cat-${openCat.category}`} style={viewStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <button onClick={() => setExpandedCategory(null)} style={{ padding: "4px 10px", borderRadius: "6px", border: "2px solid #d0d0d0", background: "white", cursor: "pointer", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>← 戻る</button>
                  <div style={{ flex: 1, padding: "4px 10px", borderRadius: "6px", background: openCat.color, border: `2px solid ${openCat.borderColor}`, fontWeight: "bold", fontSize: "13px", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{openCat.category}</div>
                  <div onClick={() => { setEditingCategory(openCat.category); setEditCategoryForm({ name: openCat.category, bgColor: openCat.color, borderColor: openCat.borderColor }); }}
                    style={{ width: "26px", height: "26px", borderRadius: "50%", background: openCat.borderColor, color: "white", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>✎</div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", alignContent: "start", background: "#f9f9f9", border: `2px solid ${openCat.borderColor}`, borderRadius: "8px", padding: "8px" }}>
                  {openCat.items.map((item, idx) => (
                    <div key={item.title} style={{ display: "flex", flexDirection: "column", gap: "3px", ...itemAnim(idx) }}>
                      <div
                        onMouseDown={() => { setDraggingNewType(item.title); setDraggingCategoryItem({ categoryName: openCat.category, itemTitle: item.title }); setPressedType(item.title); }}
                        onMouseUp={() => { setDraggingNewType(null); setDraggingCategoryItem(null); }}
                        onContextMenu={(e) => handleColorChange(e, openCat.category, item.title)}
                        style={{ background: draggingCategoryItem?.itemTitle === item.title ? "transparent" : item.color, border: `2px solid ${item.borderColor}`, borderRadius: "6px", padding: "8px", cursor: "grab", fontWeight: "bold", fontSize: "12px", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minHeight: "34px", display: "flex", alignItems: "center", justifyContent: "center", opacity: draggingCategoryItem?.itemTitle === item.title ? 0.3 : 1 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "10px", color: "#666", textAlign: "center" }}>{item.duration}分</div>
                    </div>
                  ))}
                  <div
                    onClick={() => { setIsAddItemModalOpen(true); setAddItemForm({ mode: "existing", categoryName: openCat.category, itemName: "", duration: 60, bgColor: openCat.color, borderColor: openCat.borderColor }); setTempBgColor(openCat.color); setTempBorderColor(openCat.borderColor); }}
                    style={{ background: "white", border: `2px dashed ${openCat.borderColor}`, borderRadius: "6px", padding: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", textAlign: "center", minHeight: "34px", display: "flex", alignItems: "center", justifyContent: "center", color: openCat.borderColor, ...itemAnim(openCat.items.length) }}>
                    ＋ 項目追加
                  </div>
                </div>
              </div>
            );
          })()}
          {draggingCategoryItem && (() => { const ghostColor = getGhostColor(); return (<div style={{ position: "fixed", left: mousePos.x - 40, top: mousePos.y - 20, pointerEvents: "none", zIndex: 9999 }}><div style={{ background: ghostColor.bg, border: `2px solid ${ghostColor.border}`, borderRadius: "6px", padding: "8px 12px", fontWeight: "bold", fontSize: "11px", whiteSpace: "nowrap", backdropFilter: "blur(4px)" }}>{draggingCategoryItem.itemTitle}</div></div>); })()}
        </div>
      </div>

      {editingCategory && (<div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: "420px", background: "white", borderRadius: "16px", padding: "25px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}><div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px", display: "flex", justifyContent: "space-between" }}><span>カテゴリー編集</span><span onClick={() => setEditingCategory(null)} style={{ cursor: "pointer", color: "#ccc" }}>×</span></div><div style={{ marginBottom: "15px" }}><div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>カテゴリー名</div><input type="text" value={editCategoryForm.name} onChange={e => setEditCategoryForm({ ...editCategoryForm, name: e.target.value })} style={{ width: "100%", padding: "10px", border: "2px solid #d0d0d0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} /></div><div style={{ marginBottom: "15px" }}><div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>色を選択</div><div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}><div style={{ flex: 1 }}><div style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>背景色</div><input type="color" value={editCategoryForm.bgColor} onChange={e => setEditCategoryForm({ ...editCategoryForm, bgColor: e.target.value })} style={{ width: "100%", height: "40px", border: "2px solid #d0d0d0", borderRadius: "6px", cursor: "pointer", padding: "2px" }} /></div><div style={{ flex: 1 }}><div style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>枠線色</div><input type="color" value={editCategoryForm.borderColor} onChange={e => setEditCategoryForm({ ...editCategoryForm, borderColor: e.target.value })} style={{ width: "100%", height: "40px", border: "2px solid #d0d0d0", borderRadius: "6px", cursor: "pointer", padding: "2px" }} /></div><div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}><div style={{ width: "100%", height: "40px", background: editCategoryForm.bgColor, border: `3px solid ${editCategoryForm.borderColor}`, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" }}>プレビュー</div></div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>{COLOR_PALETTE.map((color, idx) => (<div key={idx} onClick={() => setEditCategoryForm({ ...editCategoryForm, bgColor: color.bg, borderColor: color.border })} style={{ width: "100%", height: "50px", background: color.bg, border: editCategoryForm.bgColor === color.bg ? `4px solid ${color.border}` : `2px solid ${color.border}`, borderRadius: "6px", cursor: "pointer" }} />))}</div></div><div style={{ display: "flex", gap: "10px", marginTop: "20px" }}><button onClick={() => setEditingCategory(null)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid #d0d0d0", background: "white", cursor: "pointer" }}>キャンセル</button><button onClick={() => { if (window.confirm(`「${editingCategory}」を削除しますか？`)) { setWorkCategories(prev => prev.filter(cat => cat.category !== editingCategory)); setEditingCategory(null); } }} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid #ff5252", background: "white", color: "#ff5252", cursor: "pointer", fontWeight: "bold" }}>削除</button><button onClick={() => { if (!editCategoryForm.name.trim()) { alert("カテゴリー名を入力してください"); return; } setWorkCategories(prev => prev.map(cat => cat.category === editingCategory ? { ...cat, category: editCategoryForm.name.trim(), color: editCategoryForm.bgColor, borderColor: editCategoryForm.borderColor } : cat)); setEditingCategory(null); }} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#7d2ae8", color: "white", cursor: "pointer", fontWeight: "bold" }}>保存</button></div></div></div>)}

      <div data-print-timeline style={{ flex: 1, margin: "0 20px 10px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, background: "#ecf3f9", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "2px solid #e8e8e8" }}>
          <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", color: "white", padding: "12px 20px", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
  <span>📅 {selectedDate} の予約状況　（出勤: {staffList.length}名）</span>
  <div data-no-print style={{ display: "flex", gap: "8px" }}>
    {(['A4', 'A3'] as const).map(p => (
      <button key={p} onClick={() => printTimeline(p)} style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>🖨 {p}で印刷</button>
    ))}
  </div>
</div>
          <div ref={headerScrollRef} style={{ display: "flex", background: "#fcfcfc", borderBottom: "3px solid #d0d0d0", zIndex: 10, overflowX: "hidden" }}>
            <div style={{ width: SIDE_WIDTH, borderRight: "3px solid #d0d0d0", flexShrink: 0 }} />
            {Array.from({ length: totalHours }).map((_, i) => (<div key={i} style={{ width: COLUMN_WIDTH, textAlign: "center", padding: "10px 0", fontSize: "12px", fontWeight: "bold", color: "#888", borderRight: "3px solid #d0d0d0", flexShrink: 0 }}>{settings.startHour + i}:00</div>))}
          </div>
          <div ref={scrollRef} style={{ position: "relative", overflowX: "auto", overflowY: "auto", flex: 1 }}>
            <div style={{ width: "fit-content", minWidth: "100%", position: "relative" }}>
              {staffList.length === 0 ? (<div style={{ textAlign: "center", padding: "40px", color: "#999", fontSize: "14px" }}>「出勤設定」から本日の出勤スタッフを選択してください</div>) : (
                staffList.map((staff) => (
                  <div key={staff} style={{ display: "flex", borderBottom: "2px solid #d0d0d0", height: ROW_HEIGHT, position: "relative" }}>
                    <div style={{ width: SIDE_WIDTH, position: "sticky", left: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", fontWeight: "bold", background: "#fcfcfc", borderRight: "3px solid #d0d0d0", flexShrink: 0, zIndex: 5 }}>
                      <span style={{ fontSize: settings.isCompact ? '12px' : '14px' }}>{staff}</span>
                      <div onClick={async () => {
                        if (staff.startsWith('予約枠')) {
                          const options = allStaff.filter(s => !(attendance[selectedDate] || []).includes(s));
                          if (options.length === 0) { alert('割り当て可能なスタッフがいません'); return; }
                          const selected = window.prompt(`スタッフを選択:\n${options.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n番号を入力:`);
                          if (!selected) return;
                          const idx = parseInt(selected) - 1;
                          if (idx < 0 || idx >= options.length) { alert('無効な番号です'); return; }
                          const newName = options[idx];
                          setAppointments(prev => prev.map(app => app.staff === staff && app.date === selectedDate ? { ...app, staff: newName } : app));
                          if (userId) await supabase.from('appointments').update({ staff: newName }).eq('user_id', userId).eq('staff', staff).eq('date', selectedDate);
                          const current = attendance[selectedDate] || [];
                          if (!current.includes(newName)) {
                            await supabase.from('staff_attendance').insert({ user_id: userId, date: selectedDate, staff_name: newName });
                            setAttendance(prev => ({ ...prev, [selectedDate]: [...current, newName] }));
                          }
                        } else {
                          const newName = window.prompt("スタッフ名を変更:", staff); if (newName?.trim() && newName.trim() !== staff && userId) { await supabase.from('staff_members').update({ name: newName.trim() }).eq('user_id', userId).eq('name', staff); await supabase.from('staff_attendance').update({ staff_name: newName.trim() }).eq('user_id', userId).eq('staff_name', staff); await supabase.from('appointments').update({ staff: newName.trim() }).eq('user_id', userId).eq('staff', staff); setAllStaff(prev => prev.map(s => s === staff ? newName.trim() : s)); setAttendance(prev => { const newAtt: any = {}; Object.keys(prev).forEach(date => { newAtt[date] = prev[date].map((s: string) => s === staff ? newName.trim() : s); }); return newAtt; }); setAppointments(prev => prev.map(app => app.staff === staff ? { ...app, staff: newName.trim() } : app)); }
                        }
                      }} style={{ width: "22px", height: "22px", borderRadius: "50%", background: staff.startsWith('予約枠') ? "#f59e0b" : "#7d2ae8", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", cursor: "pointer", flexShrink: 0 }}>{staff.startsWith('予約枠') ? '👤' : '✎'}</div>
                    </div>
                    <div style={{ flex: 1, display: "flex" }}>{Array.from({ length: totalHours * 4 }).map((_, i) => (<div key={i} style={{ width: COLUMN_WIDTH / 4, borderRight: i % 4 === 3 ? "2px solid #c0c0c0" : i % 2 === 1 ? "1px solid #d8d8d8" : "1px dashed #b0b0b0", flexShrink: 0 }} />))}</div>
                    {filteredBlocks.map((block) => { const bLeft = ((block.start / 60) - settings.startHour) * COLUMN_WIDTH; const bWidth = ((block.end - block.start) / 60) * COLUMN_WIDTH; return (<div key={block.id} onClick={() => removeBlock(block.id)} style={{ position: "absolute", left: SIDE_WIDTH + bLeft, top: 0, width: bWidth, height: "100%", background: "repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #eeeeee 10px, #eeeeee 20px)", zIndex: 2, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "10px", fontWeight: "bold" }}>CLOSED ×</div>); })}
                  </div>
                ))
              )}
              {filteredAppointments.map((app) => {
                const staffIdx = staffList.indexOf(app.staff);
                if (staffIdx === -1) return null;
                let styleMaster = { color: "#eee", borderColor: "#ccc" };
                for (const category of workCategories) { const item = category.items.find(i => i.title === app.title); if (item) { styleMaster = { color: item.color, borderColor: item.borderColor }; break; } }
                const leftPos = SIDE_WIDTH + (app.start / 60 - settings.startHour) * COLUMN_WIDTH;
                const itemWidth = ((app.end - app.start) / 60) * COLUMN_WIDTH;
                return (
                  <div key={app.id} style={{ position: "absolute", left: leftPos, top: staffIdx * ROW_HEIGHT + 2, width: itemWidth, height: ROW_HEIGHT - 4, padding: "2px", boxSizing: "border-box", zIndex: activeAction?.id === app.id || resizingAppId === app.id ? 100 : 3, opacity: activeAction?.id === app.id && isDragStarted ? 0.6 : 1 }}>
                    <div onMouseDown={(e) => { setActiveAction({ id: app.id, type: "move", startX: e.clientX, startY: e.clientY }); }} onDoubleClick={() => openAppointmentDetail(app)} style={{ height: "100%", background: styleMaster.color, borderLeft: `5px solid ${styleMaster.borderColor}`, borderRadius: "4px", padding: "6px", cursor: "pointer", boxShadow: "0 3px 8px rgba(0,0,0,0.15)", position: "relative", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", overflow: "hidden" }}>{app.is_web && (<span style={{ background: "#6366f1", color: "white", fontSize: "8px", fontWeight: "bold", padding: "1px 4px", borderRadius: "3px", flexShrink: 0 }}>WEB</span>)}<span style={{ fontWeight: "bold", fontSize: settings.isCompact ? "12px" : "14px", overflow: "hidden", textOverflow: "ellipsis" }}>{app.title}</span></div>
                      {!settings.isCompact && (<><div style={{ fontSize: "12px", color: "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>{app.customerName}</div><div style={{ fontSize: "12px", color: "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.carModel}</div></>)}
                      <div onMouseDown={(e) => { e.stopPropagation(); setResizingAppId(app.id); }} style={{ position: "absolute", right: 0, top: 0, width: "10px", height: "100%", cursor: "ew-resize" }} />
                    </div>
                  </div>
                );
              })}
              {activeAction && isDragStarted && (() => { const draggingApp = appointments.find(a => a.id === activeAction.id); if (!draggingApp) return null; let styleMaster = { color: "#eee", borderColor: "#ccc" }; for (const category of workCategories) { const item = category.items.find(i => i.title === draggingApp.title); if (item) { styleMaster = { color: item.color, borderColor: item.borderColor }; break; } } const duration = draggingApp.end - draggingApp.start; const ghostWidth = (duration / 60) * COLUMN_WIDTH; return (<div style={{ position: "fixed", left: mousePos.x - ghostWidth / 2, top: mousePos.y - ROW_HEIGHT / 2, width: ghostWidth, height: ROW_HEIGHT - 4, pointerEvents: "none", zIndex: 9999 }}><div style={{ height: "100%", background: styleMaster.color, borderLeft: `5px solid ${styleMaster.borderColor}`, borderRadius: "4px", padding: "6px", boxShadow: "0 8px 20px rgba(0,0,0,0.3)", opacity: 0.9 }}><div style={{ fontWeight: "bold", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden" }}>{draggingApp.title}</div><div style={{ fontSize: "9px", color: "#666" }}>{draggingApp.customerName}</div></div></div>); })()}
            </div>
          </div>
        </div>
        <div data-no-print style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 500, pointerEvents: "none" }}>
          <div ref={trashRef} style={{ width: "500px", height: "60px", border: `3px dashed ${isOverTrash ? "#f44336" : "#d0d0d0"}`, background: isOverTrash ? "#ffebee" : "#fff", borderRadius: "25px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", opacity: (activeAction || draggingNewType || draggingCategoryItem) ? 1 : 0, transition: "0.2s" }}><span>{isOverTrash ? "🔥" : "🗑️"}</span><span style={{ fontSize: "12px", fontWeight: "bold", color: isOverTrash ? "#f44336" : "#999" }}>ここにドラッグして削除</span></div>
        </div>
      </div>

      {showFeaturePreview && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowFeaturePreview(false)}>
          <div style={{ width: "520px", maxHeight: "90vh", overflowY: "auto", background: "linear-gradient(135deg, #0f172a, #1e293b)", borderRadius: "20px", padding: "30px", color: "white" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div><div style={{ fontSize: "20px", fontWeight: "bold" }}>⭐ As-Works プレミアム</div><div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>ビジネスをもっと効率的に</div></div>
              <span onClick={() => setShowFeaturePreview(false)} style={{ cursor: "pointer", color: "#64748b", fontSize: "24px" }}>×</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {[
                { icon: "📅", title: "WEB予約受付", desc: "お客様がスマホから24時間予約可能。空き状況を自動で判定します", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)" },
                { icon: "👥", title: "顧客台帳", desc: "来店履歴・車両情報・作業記録を一元管理。次回アクションも設定可能", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" },
                { icon: "📋", title: "予約管理", desc: "WEB予約の確認・承認、顧客登録への連携がワンタップで完了", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)" },
                { icon: "⚙️", title: "カスタマイズ", desc: "業種に合わせた記録項目を自由に作成。作業ごとの詳細を記録できます", bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.3)" },
              ].map(f => (
                <div key={f.title} style={{ background: f.bg, border: `1px solid ${f.border}`, borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>{f.icon}</div>
                  <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>{f.title}</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.6" }}>{f.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ fontSize: "22px", fontWeight: "bold" }}>¥980<span style={{ fontSize: "13px", color: "#94a3b8" }}>/月</span></div>
                <div style={{ fontSize: "12px", color: "#a78bfa", background: "rgba(139,92,246,0.2)", padding: "4px 10px", borderRadius: "20px" }}>30日間無料トライアル</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div onClick={() => { setShowFeaturePreview(false); setShowUpgrade(true); }} style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", textAlign: "center", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>無料で始める →</div>
                <div onClick={() => setShowFeaturePreview(false)} style={{ padding: "12px 20px", borderRadius: "10px", border: "1px solid #475569", textAlign: "center", fontSize: "14px", color: "#94a3b8", cursor: "pointer" }}>閉じる</div>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>トライアル期間中はいつでもキャンセルできます</div>
          </div>
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} userId={userId || ""} />
    </div>
  );
}
