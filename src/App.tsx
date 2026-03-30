/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, Component, ReactNode, ErrorInfo } from 'react';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  LayoutDashboard, 
  Plus, 
  Search, 
  Bell, 
  LogOut, 
  ChevronRight,
  Phone,
  Mail,
  Clock,
  MapPin,
  Menu,
  X,
  ChevronLeft,
  Activity,
  Sun,
  Moon,
  QrCode,
  TrendingUp,
  Dumbbell,
  Scale,
  Ruler,
  History,
  CheckCircle2,
  Flame,
  ChevronDown,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { PopupMenu } from './components/PopupMenu';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area 
} from 'recharts';
import { 
  Member, 
  INITIAL_MEMBERS, 
  PLANS, 
  SCHEDULE, 
  MembershipType,
  ProgressRecord,
  PaymentRecord,
  NotificationRecord,
  WorkoutPlan
} from './types';
import { 
  db, 
  auth, 
  googleProvider, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  getDoc,
  orderBy,
  limit,
  signInWithPopup, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  OperationType,
  handleFirestoreError,
  User,
  getDocs,
  addDoc,
  deleteDoc,
  getDocFromServer,
  storage,
  ref,
  uploadBytes,
  getDownloadURL
} from './firebase';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorDetails = "";
      try {
        const parsed = JSON.parse(this.state.error?.message || "{}");
        errorDetails = JSON.stringify(parsed, null, 2);
      } catch {
        errorDetails = this.state.error?.message || "Unknown error";
      }

      return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center p-8">
          <div className="glass-card max-w-2xl w-full p-8 space-y-6">
            <div className="flex items-center gap-4 text-red-500">
              <X size={48} />
              <h1 className="text-3xl font-bold">Something went wrong</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400">The application encountered an unexpected error. Please check the details below or try refreshing the page.</p>
            <pre className="bg-black/5 dark:bg-black/50 p-4 rounded-xl overflow-auto text-xs font-mono text-red-600 dark:text-red-400 border border-red-500/20 max-h-64">
              {errorDetails}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-4 text-lg font-bold"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <FitCityApp />
    </ErrorBoundary>
  );
}

function FitCityApp() {
  const [loginMode, setLoginMode] = useState<'admin' | 'member'>('member');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('fitcity_isLoggedIn') === 'true';
  });
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('fitcity_theme') === 'dark' || 
           (!localStorage.getItem('fitcity_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [renewPlan, setRenewPlan] = useState('');
  const [editPlan, setEditPlan] = useState('');
  
  const [attendanceModalMemberId, setAttendanceModalMemberId] = useState<string | null>(null);
  const [attendanceMonth, setAttendanceMonth] = useState<Date>(new Date());
  const [selectedMemberProgress, setSelectedMemberProgress] = useState<ProgressRecord[]>([]);
  const [selectedMemberPayments, setSelectedMemberPayments] = useState<PaymentRecord[]>([]);
  const [memberModalTab, setMemberModalTab] = useState<'overview' | 'attendance' | 'progress' | 'payments'>('overview');

  // Member specific state
  const [memberProfile, setMemberProfile] = useState<Member | null>(null);
  const [memberProgress, setMemberProgress] = useState<ProgressRecord[]>([]);
  const [memberPayments, setMemberPayments] = useState<PaymentRecord[]>([]);
  const [memberNotifications, setMemberNotifications] = useState<NotificationRecord[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<WorkoutPlan | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isLogStatsModalOpen, setIsLogStatsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fitcity_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fitcity_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (memberProfile) setRenewPlan(memberProfile.plan);
    if (editingMember) setEditPlan(editingMember.plan);
  }, [memberProfile, editingMember]);
  
  // Admin specific state
  const [logs, setLogs] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [isEditingAdminProfile, setIsEditingAdminProfile] = useState(false);
  const [adminProfileData, setAdminProfileData] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const isAdmin = userRole === 'admin' || (user && (user.email === 'hemants.shekhawat18@gmail.com' || user.email === 'info.fc@gmail.com' || user.email === 'Info.fc@gmail.com'));

  const chartData = React.useMemo(() => {
    const revenueByMonth: Record<string, number> = {};
    const newMembersByMonth: Record<string, number> = {};
    
    members.forEach(m => {
      const month = m.joinDate.substring(0, 7); // YYYY-MM
      newMembersByMonth[month] = (newMembersByMonth[month] || 0) + 1;
      revenueByMonth[month] = (revenueByMonth[month] || 0) + m.amountPaid;
    });

    const sortedMonths = Object.keys(newMembersByMonth).sort();
    return sortedMonths.map(month => ({
      month,
      revenue: revenueByMonth[month] || 0,
      newMembers: newMembersByMonth[month] || 0
    }));
  }, [members]);

  const attendanceModalMember = members.find(m => m.id === attendanceModalMemberId) || null;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fitcity_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fitcity_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        setIsLoggedIn(true);
        
        // Fetch user role
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          // If hardcoded admin, bootstrap the user document
          const hardcodedAdmins = ['hemants.shekhawat18@gmail.com', 'info.fc@gmail.com', 'Info.fc@gmail.com'];
          if (hardcodedAdmins.includes(currentUser.email || '')) {
            await setDoc(doc(db, 'users', currentUser.uid), {
              uid: currentUser.uid,
              email: currentUser.email,
              role: 'admin',
              displayName: currentUser.displayName
            });
            setUserRole('admin');
          } else {
            setUserRole('member');
          }
        }
      } else {
        setUserRole(null);
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Admin: Fetch all members
  useEffect(() => {
    if (!isAuthReady || !user || !isAdmin) {
      if (isAuthReady && !user) {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    const q = query(collection(db, 'members'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersList: Member[] = [];
      snapshot.forEach((doc) => {
        membersList.push({ id: doc.id, ...doc.data() } as Member);
      });
      setMembers(membersList);
      setIsLoading(false);
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.LIST, 'members');
      }
    });

    return () => unsubscribe();
  }, [isAuthReady, user, isAdmin]);

  // Admin: Fetch logs
  useEffect(() => {
    if (!isAuthReady || !user || !isAdmin) return;

    const q = query(collection(db, 'logs'), orderBy('date', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsList: any[] = [];
      snapshot.forEach((doc) => {
        logsList.push({ id: doc.id, ...doc.data() });
      });
      setLogs(logsList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'logs');
    });

    return () => unsubscribe();
  }, [isAuthReady, user, isAdmin]);

  // Admin: Fetch pending members
  useEffect(() => {
    if (!isAuthReady || !user || !isAdmin) return;

    const q = query(collection(db, 'users'), where('role', '==', 'member'), where('approved', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pendingList: any[] = [];
      snapshot.forEach((doc) => {
        pendingList.push({ id: doc.id, ...doc.data() });
      });
      setPendingMembers(pendingList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [isAuthReady, user, isAdmin]);

  // Admin: Fetch full profile
  useEffect(() => {
    if (!isAuthReady || !user || !isAdmin) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setAdminProfileData(snapshot.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [isAuthReady, user, isAdmin]);

  // Admin: Fetch selected member's related data
  useEffect(() => {
    if (!isAuthReady || !user || !isAdmin || !attendanceModalMemberId) {
      setSelectedMemberProgress([]);
      setSelectedMemberPayments([]);
      return;
    }

    const selectedMember = members.find(m => m.id === attendanceModalMemberId);
    if (!selectedMember || !selectedMember.uid) return;

    // Fetch Progress
    const progressQuery = query(collection(db, 'progress'), where('uid', '==', selectedMember.uid));
    const unsubProgress = onSnapshot(progressQuery, (snapshot) => {
      const list: ProgressRecord[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as ProgressRecord));
      setSelectedMemberProgress(list.sort((a, b) => b.date.localeCompare(a.date)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'progress');
    });

    // Fetch Payments
    const paymentsQuery = query(collection(db, 'payments'), where('uid', '==', selectedMember.uid));
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      const list: PaymentRecord[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as PaymentRecord));
      setSelectedMemberPayments(list.sort((a, b) => b.date.localeCompare(a.date)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });

    return () => {
      unsubProgress();
      unsubPayments();
    };
  }, [isAuthReady, user, isAdmin, attendanceModalMemberId, members]);

  // Member: Fetch profile and related data
  useEffect(() => {
    if (!isAuthReady || !user || isAdmin) return;

    setIsLoading(true);
    
    // 1. Fetch Member Profile by email
    const memberQuery = query(collection(db, 'members'), where('email', '==', user.email));
    const unsubProfile = onSnapshot(memberQuery, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        const profile = { id: snapshot.docs[0].id, ...docData } as Member;
        setMemberProfile(profile);
        
        // If profile doesn't have uid, link it
        if (!profile.uid) {
          updateDoc(doc(db, 'members', profile.id), { uid: user.uid });
        }
      } else {
        setMemberProfile(null);
      }
      setIsLoading(false);
    });

    // 2. Fetch Progress
    const progressQuery = query(collection(db, 'progress'), where('uid', '==', user.uid));
    const unsubProgress = onSnapshot(progressQuery, (snapshot) => {
      const list: ProgressRecord[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as ProgressRecord));
      setMemberProgress(list.sort((a, b) => b.date.localeCompare(a.date)));
    });

    // 3. Fetch Payments
    const paymentsQuery = query(collection(db, 'payments'), where('uid', '==', user.uid));
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      const list: PaymentRecord[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as PaymentRecord));
      setMemberPayments(list.sort((a, b) => b.date.localeCompare(a.date)));
    });

    // 4. Fetch Notifications
    const notificationsQuery = query(collection(db, 'notifications'), where('uid', '==', user.uid));
    const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const list: NotificationRecord[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as NotificationRecord));
      setMemberNotifications(list.sort((a, b) => b.date.localeCompare(a.date)));
    });

    // 5. Fetch Workout for today
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[new Date().getDay()];
    const workoutQuery = query(collection(db, 'workouts'), where('day', '==', todayName));
    const unsubWorkout = onSnapshot(workoutQuery, (snapshot) => {
      if (!snapshot.empty) {
        setTodayWorkout({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as WorkoutPlan);
      } else {
        // Fallback to schedule if no specific workout plan exists
        const sched = SCHEDULE.find(s => {
          const shortDays: Record<string, string> = { 'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 'THU': 'Thursday', 'FRI': 'Friday', 'SAT': 'Saturday', 'SUN': 'Sunday' };
          return shortDays[s.day] === todayName;
        });
        if (sched) {
          setTodayWorkout({
            day: todayName,
            title: sched.morning,
            exercises: [{ name: 'Warm-up', sets: 1, reps: '10 mins' }, { name: sched.morning, sets: 4, reps: '12-15' }]
          });
        }
      }
    });

    return () => {
      unsubProfile();
      unsubProgress();
      unsubPayments();
      unsubNotifications();
      unsubWorkout();
    };
  }, [isAuthReady, user, isAdmin]);

  useEffect(() => {
    localStorage.setItem('fitcity_isLoggedIn', isLoggedIn.toString());
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setLoginError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check role and approval status
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;
        const approved = userData.approved;

        if (loginMode === 'admin' && role !== 'admin') {
          setLoginError('You do not have admin access.');
          await auth.signOut();
          return;
        }
        if (loginMode === 'member') {
          if (role !== 'member') {
            setLoginError('You do not have member access.');
            await auth.signOut();
            return;
          }
          if (!approved) {
            setLoginError('Your account is pending admin approval.');
            await auth.signOut();
            return;
          }
        }
      } else {
        setLoginError('User role not found.');
        await auth.signOut();
        return;
      }

      setIsLoggedIn(true);
    } catch (error: any) {
      console.error("Login Error:", error);
      
      const errorCode = error.code || '';
      const errorMessage = error.message || '';

      if (errorCode === 'auth/invalid-credential' || errorMessage.includes('auth/invalid-credential') || errorCode === 'auth/wrong-password' || errorMessage.includes('auth/wrong-password') || errorCode === 'auth/user-not-found' || errorMessage.includes('auth/user-not-found')) {
        setLoginError('Invalid email or password.');
      } else if (errorCode === 'auth/user-disabled' || errorMessage.includes('auth/user-disabled')) {
        setLoginError('This account has been disabled.');
      } else if (errorCode === 'auth/too-many-requests' || errorMessage.includes('auth/too-many-requests')) {
        setLoginError('Too many attempts. Please try again later.');
      } else if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('auth/unauthorized-domain')) {
        setLoginError('This domain is not authorized.');
      } else {
        setLoginError(`Login failed: ${errorMessage}`);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setLoginError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        role: loginMode, // 'admin' or 'member'
        displayName: email.split('@')[0],
        approved: loginMode === 'admin' ? true : false // Admins are auto-approved
      });

      setLoginError('Account created! Please wait for admin approval.');
      await auth.signOut();
    } catch (error: any) {
      console.error("Sign Up Error:", error);
      const errorCode = error.code || '';
      const errorMessage = error.message || '';
      
      if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('auth/email-already-in-use')) {
        setLoginError('This email is already in use. Please login instead.');
      } else if (errorCode === 'auth/weak-password' || errorMessage.includes('auth/weak-password')) {
        setLoginError('Password should be at least 6 characters.');
      } else if (errorCode === 'auth/invalid-email' || errorMessage.includes('auth/invalid-email')) {
        setLoginError('Invalid email address.');
      } else {
        setLoginError(`Failed to sign up: ${errorMessage}`);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    try {
      await signInWithPopup(auth, googleProvider);
      setIsLoggedIn(true);
    } catch (error: any) {
      console.error("Google Login Error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        setLoginError('This domain is not authorized for Google Sign-In. Please add it to the Authorized Domains in the Firebase Console.');
      } else if (error.code === 'auth/popup-blocked') {
        setLoginError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setLoginError(`Failed to sign in with Google: ${error.message || 'Please try again.'}`);
      }
    }
  };

  const [isMemberProfileModalOpen, setIsMemberProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsLoggedIn(false);
      setIsAdminDropdownOpen(false);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleApproveMember = async (memberId: string) => {
    try {
      await updateDoc(doc(db, 'users', memberId), { approved: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleDeclineMember = async (memberId: string) => {
    try {
      await updateDoc(doc(db, 'users', memberId), { approved: false, role: 'declined' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleBulkDelete = async () => {
    for (const id of selectedMembers) {
      await deleteDoc(doc(db, 'members', id));
    }
    setMembers(prev => prev.filter(m => !selectedMembers.includes(m.id)));
    setSelectedMembers([]);
  };

  const handleBulkStatus = async (status: string) => {
    for (const id of selectedMembers) {
      await updateDoc(doc(db, 'members', id), { status });
    }
    setMembers(prev => prev.map(m => selectedMembers.includes(m.id) ? { ...m, status } : m));
    setSelectedMembers([]);
  };

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'Active').length,
    expiring: members.filter(m => {
      const expiry = new Date(m.expiryDate);
      const today = new Date();
      const diff = expiry.getTime() - today.getTime();
      return diff > 0 && diff < (7 * 24 * 60 * 60 * 1000); // Next 7 days
    }).length,
    revenue: members.reduce((acc, m) => acc + m.amountPaid, 0)
  };

  const filteredMembers = members.filter(m => 
    (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm)) &&
    (filterPlan === 'All' || m.plan === filterPlan) &&
    (filterStatus === 'All' || m.status === filterStatus)
  );

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const [isRegistering, setIsRegistering] = useState(false);

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setIsRegistering(true);
    const formData = new FormData(e.currentTarget);
    const planName = formData.get('plan') as MembershipType;
    const plan = PLANS.find(p => p.name === planName);
    
    try {
      let photoURL = editingMember?.photoURL || '';
      if (selectedFile) {
        try {
          const storageRef = ref(storage, `members/${Date.now()}_${selectedFile.name}`);
          const metadata = { contentType: selectedFile.type };
          await uploadBytes(storageRef, selectedFile, metadata);
          photoURL = await getDownloadURL(storageRef);
        } catch (storageError: any) {
          console.error("Storage Error:", storageError);
          throw new Error(`Failed to upload image: ${storageError.message || 'Unknown error'}. Please ensure Firebase Storage is enabled and rules allow access.`);
        }
      }
      
      const memberData = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        expiryDate: formData.get('expiryDate') as string,
        plan: planName,
        amountPaid: plan?.price || 0,
        photoURL
      };

      if (editingMember) {
        await updateDoc(doc(db, 'members', editingMember.id), memberData);
        // Log activity
        await addDoc(collection(db, 'logs'), {
          type: 'MemberUpdated',
          message: `Updated member: ${memberData.name}`,
          date: new Date().toISOString(),
          adminId: user.uid
        });
      } else {
        const newId = Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, 'members', newId), {
          ...memberData,
          id: newId,
          joinDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          attendance: {}
        });
        // Log activity
        await addDoc(collection(db, 'logs'), {
          type: 'MemberAdded',
          message: `Added new member: ${memberData.name}`,
          date: new Date().toISOString(),
          adminId: user.uid
        });
      }
      setIsAddModalOpen(false);
      setEditingMember(null);
      setSelectedFile(null);
    } catch (error) {
      handleFirestoreError(error, editingMember ? OperationType.UPDATE : OperationType.CREATE, 'members');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleToggleAttendance = async (memberId: string, dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr > todayStr) return; // Cannot mark future attendance

    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const currentAttendance = member.attendance || {};
    const newAttendance = {
      ...currentAttendance,
      [dateStr]: !currentAttendance[dateStr]
    };

    try {
      await updateDoc(doc(db, 'members', memberId), {
        attendance: newAttendance
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `members/${memberId}`);
    }
  };

  const handleCheckIn = async () => {
    if (!memberProfile) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const newAttendance = {
      ...(memberProfile.attendance || {}),
      [todayStr]: true
    };
    try {
      await updateDoc(doc(db, 'members', memberProfile.id), {
        attendance: newAttendance
      });
      setIsCheckInModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `members/${memberProfile.id}`);
    }
  };

  const handleLogStats = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const weight = parseFloat(formData.get('weight') as string);
    const chest = parseFloat(formData.get('chest') as string);
    const waist = parseFloat(formData.get('waist') as string);
    const hips = parseFloat(formData.get('hips') as string);
    const arms = parseFloat(formData.get('arms') as string);

    const progressData: ProgressRecord = {
      uid: user.uid,
      date: new Date().toISOString().split('T')[0],
      weight,
      measurements: { chest, waist, hips, arms }
    };

    try {
      await addDoc(collection(db, 'progress'), progressData);
      setIsLogStatsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'progress');
    }
  };

  const handleRenewMembership = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!memberProfile || !user) return;
    const formData = new FormData(e.currentTarget);
    const planName = formData.get('plan') as MembershipType;
    const plan = PLANS.find(p => p.name === planName);
    
    // Calculate new expiry date
    const currentExpiry = new Date(memberProfile.expiryDate);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate);
    
    if (planName.includes('Monthly') || planName === 'PT' || planName === 'GPT') {
      newExpiry.setMonth(newExpiry.getMonth() + 1);
    } else if (planName.includes('Quarterly')) {
      newExpiry.setMonth(newExpiry.getMonth() + 3);
    } else if (planName.includes('Half Yearly')) {
      newExpiry.setMonth(newExpiry.getMonth() + 6);
    }

    try {
      // 1. Update Member Profile
      await updateDoc(doc(db, 'members', memberProfile.id), {
        plan: planName,
        expiryDate: newExpiry.toISOString().split('T')[0],
        status: 'Active'
      });

      // 2. Record Payment
      await addDoc(collection(db, 'payments'), {
        uid: user.uid,
        date: new Date().toISOString().split('T')[0],
        amount: plan?.price || 0,
        plan: planName,
        status: 'Success'
      });

      // 3. Add Notification
      await addDoc(collection(db, 'notifications'), {
        uid: user.uid,
        title: 'Membership Renewed',
        message: `Your ${planName} membership has been successfully renewed until ${newExpiry.toLocaleDateString()}.`,
        type: 'Renewal',
        date: new Date().toISOString(),
        read: false
      });

      // 4. Log Activity (if admin)
      if (isAdmin) {
        await addDoc(collection(db, 'logs'), {
          type: 'PlanUpdated',
          message: `Renewed membership for ${memberProfile.name}`,
          date: new Date().toISOString(),
          adminId: user.uid
        });
      }

      setIsRenewModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `members/${memberProfile.id}`);
    }
  };

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleEditAdminProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    const formData = new FormData(e.currentTarget);
    const displayName = formData.get('displayName') as string;
    const phone = formData.get('phone') as string;
    const location = formData.get('location') as string;

    try {
      let logoURL = adminProfileData?.logoURL || '';
      if (logoFile) {
        try {
          const storageRef = ref(storage, `admin/logo_${Date.now()}_${logoFile.name}`);
          const metadata = { contentType: logoFile.type };
          await uploadBytes(storageRef, logoFile, metadata);
          logoURL = await getDownloadURL(storageRef);
        } catch (storageError: any) {
          console.error("Storage Error:", storageError);
          throw new Error(`Failed to upload logo: ${storageError.message || 'Unknown error'}. Please ensure Firebase Storage is enabled and rules allow access.`);
        }
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        role: isAdmin ? 'admin' : 'staff',
        displayName,
        phone,
        location,
        logoURL
      }, { merge: true });
      
      // Log activity
      await addDoc(collection(db, 'logs'), {
        type: 'ProfileUpdated',
        message: `Admin profile updated for ${displayName}`,
        date: new Date().toISOString(),
        adminId: user.uid
      });
      
      setIsEditingAdminProfile(false);
      setLogoFile(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const calculateStreak = () => {
    if (!memberProfile?.attendance) return 0;
    const dates = Object.keys(memberProfile.attendance).sort((a, b) => b.localeCompare(a));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (memberProfile.attendance[dateStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If it's today and not marked, check yesterday
        if (dateStr === today.toISOString().split('T')[0]) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  };

  const getDaysLeft = () => {
    if (!memberProfile?.expiryDate) return 0;
    const expiry = new Date(memberProfile.expiryDate);
    const today = new Date();
    const diff = expiry.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center p-4 font-sans selection:bg-brand-red/30">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-red/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-full max-w-md p-8 relative z-10"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-red/20">
              <Activity size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">FitCity</h1>
            <p className="text-gray-500 text-sm mt-1">{loginMode === 'admin' ? 'Admin' : 'Member'} {authMode === 'login' ? 'Login' : 'Sign Up'}</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setLoginMode('member')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${loginMode === 'member' ? 'bg-brand-red text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500'}`}
            >
              Member
            </button>
            <button
              onClick={() => setLoginMode('admin')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${loginMode === 'admin' ? 'bg-brand-red text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500'}`}
            >
              Admin
            </button>
          </div>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${authMode === 'login' ? 'bg-brand-red text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500'}`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${authMode === 'signup' ? 'bg-brand-red text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleSignUp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  name="email"
                  type="email" 
                  required
                  placeholder="admin@example.com"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-red transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Password</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  name="password"
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-red transition-all"
                />
              </div>
            </div>

            {loginError && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-500 text-sm font-medium"
              >
                {loginError}
              </motion.p>
            )}

            <button 
              type="submit"
              className="w-full btn-primary py-4 text-lg font-bold shadow-xl shadow-brand-red/20"
            >
              Sign In
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10 dark:border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#1a1a1a] px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-gray-100 dark:bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-lg active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 text-center">
            <p className="text-xs text-gray-600">
              Authorized Personnel Only. Access is monitored.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white overflow-hidden">
        {/* Member Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 260 : 80 }}
          className="hidden md:flex bg-gray-50 dark:bg-brand-gray border-r border-black/5 dark:border-white/5 flex-col z-50"
        >
          <div className="p-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {adminProfileData?.logoURL ? (
                <img src={adminProfileData.logoURL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-2xl font-bold italic text-white">F</span>
              )}
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-xl tracking-tight">
                FITCITY
                <div className="text-[10px] text-brand-red -mt-1">MEMBER</div>
              </motion.div>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'attendance', icon: QrCode, label: 'Check-in' },
              { id: 'progress', icon: TrendingUp, label: 'Progress' },
              { id: 'payments', icon: CreditCard, label: 'Payments' },
              { id: 'notifications', icon: Bell, label: 'Notifications' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' 
                    : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                } ${!isSidebarOpen ? 'justify-center' : ''}`}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <item.icon size={20} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-black/5 dark:border-white/5">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`w-full flex items-center gap-4 p-3 text-gray-400 hover:text-black dark:hover:text-white transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
            >
              <Menu size={20} />
              {isSidebarOpen && <span>Collapse</span>}
            </button>
          </div>
        </motion.aside>

        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-black/5 dark:border-white/10 flex justify-around p-2 z-50 pb-safe">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
            { id: 'attendance', icon: QrCode, label: 'Check-in' },
            { id: 'progress', icon: TrendingUp, label: 'Progress' },
            { id: 'payments', icon: CreditCard, label: 'Pay' },
            { id: 'notifications', icon: Bell, label: 'Alerts' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                activeTab === item.id ? 'text-brand-red' : 'text-gray-500'
              }`}
            >
              <item.icon size={20} className="mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <main className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0">
          <header className="h-16 md:h-20 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 md:px-8 bg-white/50 dark:bg-black/50 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-2xl font-bold capitalize">{activeTab}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-gray-500 hover:text-brand-red">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="relative">
                <button onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center font-bold">
                    {user?.displayName?.[0] || 'M'}
                  </div>
                </button>
                <AnimatePresence>
                  {isAdminDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-brand-gray border border-black/10 dark:border-white/10 rounded-xl shadow-2xl z-50"
                    >
                      <div className="p-4 border-b border-black/5 dark:border-white/5">
                        <p className="text-sm font-bold truncate">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={() => {
                            setIsMemberProfileModalOpen(true);
                            setIsAdminDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-brand-red rounded-lg flex items-center gap-2"
                        >
                          <Users size={16} /> My Profile
                        </button>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2">
                          <LogOut size={16} /> Log Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !memberProfile ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Users size={64} className="text-gray-500" />
                <h2 className="text-2xl font-bold">Profile Not Found</h2>
                <p className="text-gray-400 max-w-md">We couldn't find a member profile associated with your email ({user?.email}). Please contact the gym administrator to link your account.</p>
                <button onClick={handleLogout} className="btn-primary px-8">Log Out</button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                  <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {/* Member Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      <div className="glass-card p-4 md:p-6">
                        <p className="text-[10px] md:text-sm text-gray-400 mb-1 leading-tight">Membership Status</p>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-lg md:text-2xl font-bold ${memberProfile.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                            {memberProfile.status}
                          </h3>
                          {memberProfile.status === 'Active' && <CheckCircle2 size={16} className="text-green-500 md:w-5 md:h-5" />}
                        </div>
                      </div>
                      <div className="glass-card p-4 md:p-6">
                        <p className="text-[10px] md:text-sm text-gray-400 mb-1 leading-tight">Days Left</p>
                        <h3 className="text-xl md:text-3xl font-bold">{getDaysLeft()}</h3>
                      </div>
                      <div className="glass-card p-4 md:p-6">
                        <p className="text-[10px] md:text-sm text-gray-400 mb-1 leading-tight">Attendance Streak</p>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl md:text-3xl font-bold">{calculateStreak()}</h3>
                          <Flame size={18} className="text-orange-500 animate-bounce md:w-6 md:h-6" />
                        </div>
                      </div>
                      <div className="glass-card p-4 md:p-6">
                        <p className="text-[10px] md:text-sm text-gray-400 mb-1 leading-tight">Active Plan</p>
                        <h3 className="text-sm md:text-xl font-bold truncate">{memberProfile.plan}</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Today's Workout */}
                      <div className="lg:col-span-2 glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-bold flex items-center gap-2">
                            <Dumbbell className="text-brand-red" /> Today's Workout Plan
                          </h2>
                          <span className="text-sm text-gray-400">{todayWorkout?.day}</span>
                        </div>
                        {todayWorkout ? (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-brand-red">{todayWorkout.title}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {todayWorkout.exercises.map((ex, i) => (
                                <div key={i} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                  <div className="font-medium">{ex.name}</div>
                                  <div className="text-sm text-gray-400">{ex.sets} Sets × {ex.reps}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No workout plan scheduled for today.</p>
                        )}
                      </div>

                      {/* Quick Check-in */}
                      <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center text-brand-red">
                          <QrCode size={32} />
                        </div>
                        <h2 className="text-xl font-bold">Quick Check-in</h2>
                        <p className="text-sm text-gray-400">Scan the gym QR code or check in manually below.</p>
                        <button 
                          onClick={() => setIsCheckInModalOpen(true)}
                          className="btn-primary w-full py-3 font-bold"
                        >
                          Check In Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'attendance' && (
                  <motion.div key="attendance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-6">
                        <h2 className="text-2xl font-bold">Your Entry Pass</h2>
                        <div className="p-4 bg-white rounded-2xl shadow-xl">
                          <QRCodeSVG value={memberProfile.id} size={200} />
                        </div>
                        <p className="text-gray-400">Show this QR code at the reception to mark your attendance.</p>
                      </div>

                      <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-6">Attendance History</h2>
                        <div className="grid grid-cols-7 gap-2">
                          {[...Array(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())].map((_, i) => {
                            const date = new Date();
                            date.setDate(i + 1);
                            const dateStr = date.toISOString().split('T')[0];
                            const isPresent = memberProfile.attendance?.[dateStr];
                            return (
                              <div 
                                key={i} 
                                title={dateStr}
                                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                                  isPresent ? 'bg-green-500 text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500'
                                }`}
                              >
                                {i + 1}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'progress' && (
                  <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Progress Tracking</h2>
                      <button 
                        onClick={() => setIsLogStatsModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Plus size={20} /> Log Stats
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 glass-card p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                          <Scale className="text-brand-red" /> Weight History
                        </h3>
                        <div className="h-64 flex items-end gap-2">
                          {memberProgress.slice(0, 10).reverse().map((p, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                              <div 
                                className="w-full bg-brand-red rounded-t-lg transition-all hover:opacity-80"
                                style={{ height: `${(p.weight / 150) * 100}%` }}
                                title={`${p.weight} kg`}
                              ></div>
                              <span className="text-[10px] text-gray-500 rotate-45 mt-2">{p.date.split('-').slice(1).join('/')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="glass-card p-6 space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Ruler className="text-brand-red" /> Latest Measurements
                        </h3>
                        {memberProgress[0]?.measurements ? (
                          <div className="space-y-4">
                            {Object.entries(memberProgress[0].measurements).map(([key, val]) => (
                              <div key={key} className="flex justify-between items-center p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                                <span className="capitalize text-gray-400">{key}</span>
                                <span className="font-bold">{val} cm</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No measurements logged yet.</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'payments' && (
                  <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="glass-card p-8 bg-gradient-to-br from-brand-red/20 to-transparent border-brand-red/20">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                          <p className="text-brand-red font-bold uppercase tracking-widest text-xs mb-2">Current Plan</p>
                          <h2 className="text-3xl font-bold mb-2">{memberProfile.plan}</h2>
                          <p className="text-gray-400">Expires on {memberProfile.expiryDate}</p>
                        </div>
                        <button 
                          onClick={() => setIsRenewModalOpen(true)}
                          className="btn-primary px-10 py-4 text-lg font-bold shadow-xl shadow-brand-red/20"
                        >
                          Renew Membership
                        </button>
                      </div>
                    </div>

                    <div className="glass-card overflow-hidden">
                      <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                        <History size={20} className="text-brand-red" />
                        <h3 className="font-bold">Payment History</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-black/5 dark:bg-white/5 text-xs uppercase tracking-wider text-gray-500">
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Plan</th>
                              <th className="px-6 py-4">Amount</th>
                              <th className="px-6 py-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {memberPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                <td className="px-6 py-4 text-sm">{p.date}</td>
                                <td className="px-6 py-4 text-sm font-medium">{p.plan}</td>
                                <td className="px-6 py-4 text-sm">₹{p.amount}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    p.status === 'Success' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {memberPayments.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No payment records found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <h2 className="text-2xl font-bold">Notifications</h2>
                    <div className="space-y-4">
                      {memberNotifications.map((n) => (
                        <div key={n.id} className={`p-6 rounded-2xl border transition-all ${
                          n.read ? 'bg-black/5 dark:bg-white/5 border-transparent' : 'bg-brand-red/5 border-brand-red/20 ring-1 ring-brand-red/10'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                n.type === 'Renewal' ? 'bg-yellow-500/20 text-yellow-500' :
                                n.type === 'Workout' ? 'bg-blue-500/20 text-blue-500' :
                                n.type === 'Offer' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                              }`}>
                                {n.type === 'Renewal' ? <Clock size={18} /> : 
                                 n.type === 'Workout' ? <Dumbbell size={18} /> : 
                                 n.type === 'Offer' ? <CreditCard size={18} /> : <Bell size={18} />}
                              </div>
                              <h3 className="font-bold">{n.title}</h3>
                            </div>
                            <span className="text-xs text-gray-500">{new Date(n.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-400 text-sm ml-11">{n.message}</p>
                        </div>
                      ))}
                      {memberNotifications.length === 0 && (
                        <div className="text-center py-20 text-gray-500">
                          <Bell size={48} className="mx-auto mb-4 opacity-20" />
                          <p>No notifications yet.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </main>

        {/* Member Check-in Modal */}
        <AnimatePresence>
          {isCheckInModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsCheckInModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-card w-full max-w-md p-8 relative z-10 space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center text-brand-red mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-2xl font-bold">Daily Check-in</h2>
                  <p className="text-gray-400">Confirm your attendance for today, {new Date().toLocaleDateString('en-GB')}.</p>
                </div>
                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl text-center">
                  <p className="text-sm font-medium">Current Streak</p>
                  <p className="text-3xl font-bold text-brand-red">{calculateStreak()} Days 🔥</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setIsCheckInModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-bold">
                    Cancel
                  </button>
                  <button onClick={handleCheckIn} className="flex-1 btn-primary py-3 font-bold">
                    Confirm Check-in
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Log Stats Modal */}
        <AnimatePresence>
          {isLogStatsModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsLogStatsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-card w-full max-w-md p-8 relative z-10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Log Progress</h2>
                  <button onClick={() => setIsLogStatsModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleLogStats} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Weight (kg)</label>
                    <input name="weight" type="number" step="0.1" required className="input-field w-full" placeholder="75.5" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Chest (cm)</label>
                      <input name="chest" type="number" step="0.1" className="input-field w-full" placeholder="100" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Waist (cm)</label>
                      <input name="waist" type="number" step="0.1" className="input-field w-full" placeholder="85" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Hips (cm)</label>
                      <input name="hips" type="number" step="0.1" className="input-field w-full" placeholder="95" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Arms (cm)</label>
                      <input name="arms" type="number" step="0.1" className="input-field w-full" placeholder="35" />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full py-4 font-bold mt-4">
                    Save Progress
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Renew Membership Modal */}
        <AnimatePresence>
          {isRenewModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsRenewModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-card w-full max-w-md p-8 relative z-10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Renew Membership</h2>
                  <button onClick={() => setIsRenewModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleRenewMembership} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Select Plan</label>
                    <input type="hidden" name="plan" value={renewPlan} />
                    <PopupMenu 
                      value={renewPlan} 
                      onChange={setRenewPlan} 
                      options={PLANS.map(p => ({label: `${p.name} - ₹${p.price} (${p.duration})`, value: p.name}))}
                      className="w-full"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-brand-red/10 border border-brand-red/20">
                    <p className="text-sm text-gray-300">
                      Your current membership expires on <span className="text-brand-red font-bold">{memberProfile.expiryDate}</span>. 
                      Renewing will extend your membership from the expiry date.
                    </p>
                  </div>
                  <button type="submit" className="btn-primary w-full py-4 font-bold">
                    Confirm & Pay
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="hidden md:flex bg-gray-50 dark:bg-brand-gray border-r border-black/5 dark:border-white/5 flex-col z-50"
      >
        <div className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {adminProfileData?.logoURL ? (
              <img src={adminProfileData.logoURL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-2xl font-bold italic text-white">F</span>
            )}
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-xl tracking-tight">
              FITCITY
              <div className="text-[10px] text-brand-red -mt-1">BY ABHISHEK</div>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'members', icon: Users, label: 'Members' },
            { id: 'requests', icon: UserPlus, label: 'Requests' },
            { id: 'schedule', icon: Calendar, label: 'Schedule' },
            { id: 'plans', icon: CreditCard, label: 'Plans' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' 
                  : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
              } ${!isSidebarOpen ? 'justify-center' : ''}`}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-black/5 dark:border-white/5">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-full flex items-center gap-4 p-3 text-gray-400 hover:text-black dark:hover:text-white transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <Menu size={20} />
            {isSidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-black/5 dark:border-white/10 flex justify-around p-2 z-50 pb-safe">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
          { id: 'members', icon: Users, label: 'Members' },
          { id: 'requests', icon: UserPlus, label: 'Requests' },
          { id: 'schedule', icon: Calendar, label: 'Schedule' },
          { id: 'plans', icon: CreditCard, label: 'Plans' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'text-brand-red' 
                : 'text-gray-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <item.icon size={20} className="mb-1" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0">
        {/* Header */}
        <header className="h-16 md:h-20 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 md:px-8 bg-white/50 dark:bg-black/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="md:hidden w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center overflow-hidden">
              {adminProfileData?.logoURL ? (
                <img src={adminProfileData.logoURL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Activity size={18} className="text-white" />
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold capitalize">{activeTab}</h1>
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-400 border-l border-black/10 dark:border-white/10 pl-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-mono">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-brand-red transition-all"
              />
            </div>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-gray-500 hover:text-brand-red transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="relative p-2 text-gray-400 hover:text-brand-red transition-colors">
              <Bell size={20} className="md:w-[22px] md:h-[22px]" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-red rounded-full"></span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                className="flex items-center gap-2 md:gap-3 pl-4 md:pl-6 border-l border-black/10 dark:border-white/10 hover:opacity-80 transition-opacity"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium">{adminProfileData?.displayName || user?.displayName || 'Admin'}</div>
                  <div className="text-[10px] text-gray-500">{user?.email || 'FitCity Manager'}</div>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center font-bold text-sm md:text-base overflow-hidden">
                  {adminProfileData?.logoURL ? (
                    <img src={adminProfileData.logoURL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    (adminProfileData?.displayName?.[0] || user?.displayName?.[0] || 'A').toUpperCase()
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isAdminDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                  >
                    <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                      <p className="text-sm font-bold">{adminProfileData?.displayName || user?.displayName || 'Admin'}</p>
                      <p className="text-xs text-gray-400">{user?.email || 'Info.fc@gmail.com'}</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setIsAdminProfileOpen(true);
                          setIsAdminDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-brand-red rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Users size={16} /> My Profile
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-brand-red rounded-lg transition-colors flex items-center gap-2">
                        <LayoutDashboard size={16} /> Settings
                      </button>
                    </div>
                    <div className="p-2 border-t border-black/5 dark:border-white/5">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} /> Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { label: 'Total Members', value: stats.total, icon: Users, color: 'text-blue-500' },
                    { label: 'Active Members', value: stats.active, icon: Users, color: 'text-green-500' },
                    { label: 'Expiring Soon', value: stats.expiring, icon: Clock, color: 'text-yellow-500' },
                    { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: CreditCard, color: 'text-brand-red' },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] md:text-sm text-gray-400 mb-1 leading-tight">{stat.label}</p>
                        <h3 className="text-xl md:text-3xl font-bold">{stat.value}</h3>
                      </div>
                      <div className={`p-2 md:p-3 rounded-xl bg-black/5 dark:bg-white/5 ${stat.color}`}>
                        <stat.icon size={20} className="md:w-6 md:h-6" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-bold mb-6">Revenue Trends</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="month" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
                          <Area type="monotone" dataKey="revenue" stroke="#e11d48" fill="#e11d48" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-bold mb-6">New Members</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="month" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
                          <Bar dataKey="newMembers" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Members */}
                  <div className="lg:col-span-2 glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold">Recent Members</h2>
                      <button onClick={() => setActiveTab('members')} className="text-brand-red text-sm flex items-center gap-1 hover:underline">
                        View all <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {members.slice(0, 5).map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center font-bold">
                              {member.name[0]}
                            </div>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-xs text-gray-400">{member.plan} Plan</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">Expires</div>
                            <div className="text-xs text-gray-400">{member.expiryDate}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="glass-card p-6 space-y-6">
                    <h2 className="text-xl font-bold">Gym Info</h2>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <MapPin className="text-brand-red mt-1" size={20} />
                        <div>
                          <div className="font-medium">Location</div>
                          <p className="text-sm text-gray-400">D-29, Subhash Marg, C-Scheme, Jaipur, Rajasthan 302001</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <Phone className="text-brand-red mt-1" size={20} />
                        <div>
                          <div className="font-medium">Contact</div>
                          <p className="text-sm text-gray-400">+91 9899832424</p>
                          <p className="text-sm text-gray-400">+91 9928888008</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <Clock className="text-brand-red mt-1" size={20} />
                        <div>
                          <div className="font-medium">Hours</div>
                          <p className="text-sm text-gray-400">Mon - Sat: 6 AM - 10 PM</p>
                          <p className="text-sm text-gray-400">Sun: Closed</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-black/5 dark:border-white/5">
                      <div className="bg-brand-red/10 border border-brand-red/20 rounded-xl p-4">
                        <p className="text-xs text-brand-red font-bold uppercase tracking-wider mb-2">Announcement</p>
                        <p className="text-sm text-gray-300">New Functional Training batch starting this Monday at 7 AM!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div 
                key="members"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field w-full sm:w-64 pl-10"
                      />
                    </div>
                    <PopupMenu 
                      value={filterPlan} 
                      onChange={setFilterPlan} 
                      options={[{label: 'All Plans', value: 'All'}, ...PLANS.map(p => ({label: p.name, value: p.name}))]}
                      className="w-48"
                    />
                    <PopupMenu 
                      value={filterStatus} 
                      onChange={setFilterStatus} 
                      options={[{label: 'All Status', value: 'All'}, {label: 'Active', value: 'Active'}, {label: 'Expired', value: 'Expired'}]}
                      className="w-48"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedMembers.length > 0 && (
                      <>
                        <button onClick={handleBulkDelete} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-sm font-bold">Delete ({selectedMembers.length})</button>
                        <button onClick={() => handleBulkStatus('Active')} className="bg-brand-red/10 text-brand-red px-4 py-2 rounded-lg text-sm font-bold">Set Active</button>
                      </>
                    )}
                    <button 
                      onClick={() => {
                        setEditingMember(null);
                        setIsAddModalOpen(true);
                      }}
                      className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      <Plus size={20} /> Add Member
                    </button>
                  </div>
                </div>

                <div className="glass-card overflow-hidden">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[800px] text-left">
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                        <th className="px-6 py-4"><input type="checkbox" onChange={(e) => setSelectedMembers(e.target.checked ? filteredMembers.map(m => m.id) : [])} checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0} /></th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Member</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Plan</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Join Date</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Expiry Date</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Status</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4"><input type="checkbox" checked={selectedMembers.includes(member.id)} onChange={(e) => setSelectedMembers(e.target.checked ? [...selectedMembers, member.id] : selectedMembers.filter(id => id !== member.id))} /></td>
                          <td className="px-6 py-4">
                            <div 
                              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setAttendanceModalMemberId(member.id)}
                            >
                              <div className="relative">
                                {member.photoURL ? (
                                  <img src={member.photoURL} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center text-xs font-bold">
                                    {member.name[0]}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-xs text-gray-500">{member.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">{member.plan}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{member.joinDate}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{member.expiryDate}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              member.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => {
                                setEditingMember(member);
                                setIsAddModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

            {activeTab === 'schedule' && (
              <motion.div 
                key="schedule"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {SCHEDULE.map((item, i) => (
                  <div key={i} className="glass-card overflow-hidden">
                    <div className="bg-brand-red p-4 flex items-center justify-between">
                      <h3 className="font-bold text-lg">{item.day}</h3>
                      <Calendar size={20} />
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-widest">
                          <span>Morning Session</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {item.timeM}</span>
                        </div>
                        <div className="text-xl font-bold text-black dark:text-white">{item.morning}</div>
                      </div>
                      <div className="h-px bg-black/5 dark:bg-white/5"></div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-widest">
                          <span>Evening Session</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {item.timeE}</span>
                        </div>
                        <div className="text-xl font-bold text-black dark:text-white">{item.evening}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'requests' && (
              <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-2xl font-bold">New Member Requests</h2>
                <div className="glass-card overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                        <th className="px-6 py-4 text-sm font-semibold">Email</th>
                        <th className="px-6 py-4 text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {pendingMembers.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4">{member.email}</td>
                          <td className="px-6 py-4 flex gap-2">
                            <button onClick={() => handleApproveMember(member.id)} className="btn-primary py-1 px-3 text-sm">Confirm</button>
                            <button onClick={() => handleDeclineMember(member.id)} className="bg-red-500/10 text-red-500 py-1 px-3 text-sm rounded-lg">Decline</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'plans' && (
              <motion.div 
                key="plans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {PLANS.map((plan, i) => (
                  <div key={i} className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <CreditCard size={80} />
                    </div>
                    <div className="text-xs font-bold text-brand-red uppercase tracking-widest mb-2">{plan.type}</div>
                    <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                    <div className="text-4xl font-bold mb-2">₹{plan.price.toLocaleString()}</div>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">{plan.duration}</p>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-3 mb-8 text-left w-full">
                      <li className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-brand-red" /> Full Gym Access
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-brand-red" /> Locker Facility
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-brand-red" /> Free Consultation
                      </li>
                    </ul>
                    <button className="w-full py-3 rounded-xl border border-brand-red text-brand-red font-bold hover:bg-brand-red hover:text-white transition-all">
                      Select Plan
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-lg p-8 relative z-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">{editingMember ? 'Edit Member' : 'Add New Member'}</h2>
                <button onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMember(null);
                }} className="text-gray-400 hover:text-black dark:hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                    <input name="name" defaultValue={editingMember?.name} required className="input-field w-full" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Phone Number</label>
                    <input name="phone" defaultValue={editingMember?.phone} required className="input-field w-full" placeholder="9876543210" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Email Address</label>
                  <input name="email" type="email" defaultValue={editingMember?.email} required className="input-field w-full" placeholder="john@example.com" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Membership Plan</label>
                    <input type="hidden" name="plan" value={editPlan} />
                    <PopupMenu 
                      value={editPlan} 
                      onChange={setEditPlan} 
                      options={PLANS.map(p => ({label: `${p.name} - ₹${p.price}`, value: p.name}))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Expiry Date</label>
                    <input name="expiryDate" type="date" defaultValue={editingMember?.expiryDate} required className="input-field w-full" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 border border-dashed border-black/20 dark:border-white/20 flex items-center justify-center overflow-hidden">
                      {selectedFile ? (
                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                      ) : editingMember?.photoURL ? (
                        <img src={editingMember.photoURL} alt="Photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Plus size={24} className="text-gray-400" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-red/10 file:text-brand-red hover:file:bg-brand-red/20" 
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isRegistering}
                  className="btn-primary w-full py-4 text-lg mt-4 flex items-center justify-center gap-2"
                >
                  {isRegistering ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    editingMember ? 'Save Changes' : 'Register Member'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Profile Modal */}
      <AnimatePresence>
        {isAdminProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAdminProfileOpen(false);
                setIsEditingAdminProfile(false);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-2xl p-0 relative z-10 overflow-hidden"
            >
              <div className="h-32 bg-gradient-to-r from-brand-red to-red-900 relative">
                <button 
                  onClick={() => {
                    setIsAdminProfileOpen(false);
                    setIsEditingAdminProfile(false);
                  }} 
                  className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-md transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="px-4 md:px-8 pb-8">
                <div className="relative flex justify-between items-end -mt-8 md:-mt-12 mb-6">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-3xl md:text-4xl font-bold border-4 border-white dark:border-[#1a1a1a] shadow-xl overflow-hidden">
                    {adminProfileData?.logoURL ? (
                      <img src={adminProfileData.logoURL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      (adminProfileData?.displayName?.[0] || user?.displayName?.[0] || 'A').toUpperCase()
                    )}
                  </div>
                  {!isEditingAdminProfile ? (
                    <button 
                      onClick={() => setIsEditingAdminProfile(true)}
                      className="btn-primary py-2 px-6 text-sm"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditingAdminProfile(false)}
                        className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {isEditingAdminProfile ? (
                  <form onSubmit={handleEditAdminProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Display Name</label>
                        <input 
                          name="displayName" 
                          defaultValue={adminProfileData?.displayName || user?.displayName || ''} 
                          required 
                          className="input-field w-full" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Phone Number</label>
                        <input 
                          name="phone" 
                          defaultValue={adminProfileData?.phone || '+91 9899832424'} 
                          className="input-field w-full" 
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Location</label>
                        <input 
                          name="location" 
                          defaultValue={adminProfileData?.location || 'Jaipur, Rajasthan'} 
                          className="input-field w-full" 
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Gym Logo</label>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-black/5 dark:bg-white/5 border border-dashed border-black/20 dark:border-white/20 flex items-center justify-center overflow-hidden">
                            {logoFile ? (
                              <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-cover" />
                            ) : adminProfileData?.logoURL ? (
                              <img src={adminProfileData.logoURL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Plus size={24} className="text-gray-400" />
                            )}
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-red/10 file:text-brand-red hover:file:bg-brand-red/20"
                          />
                        </div>
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSavingProfile}
                      className="btn-primary w-full py-3 font-bold flex items-center justify-center gap-2"
                    >
                      {isSavingProfile ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold">{adminProfileData?.displayName || user?.displayName || 'Admin'}</h2>
                      <p className="text-brand-red font-medium">Head Administrator</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-4">
                        <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-black/5 dark:border-white/10 pb-2">Contact Info</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                            <Mail size={14} className="text-brand-red" />
                            <span className="truncate">{user?.email || 'Info.fc@gmail.com'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                            <Phone size={14} className="text-brand-red" />
                            <span>{adminProfileData?.phone || '+91 9899832424'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                            <MapPin size={14} className="text-brand-red" />
                            <span>{adminProfileData?.location || 'Jaipur, Rajasthan'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-black/5 dark:border-white/10 pb-2">Gym Details</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                            <LayoutDashboard size={14} className="text-brand-red" />
                            <span>FitCity By Abhishek</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                            <Users size={14} className="text-brand-red" />
                            <span>{members.length} Total Members</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                            <Clock size={14} className="text-brand-red" />
                            <span>Joined Jan 2024</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-black/5 dark:border-white/10">
                      <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Preferences</h3>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          {isDarkMode ? <Moon size={20} className="text-brand-red" /> : <Sun size={20} className="text-brand-red" />}
                          <div>
                            <p className="text-sm font-bold">Dark Mode</p>
                            <p className="text-xs text-gray-400">Toggle application theme</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsDarkMode(!isDarkMode)}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-brand-red' : 'bg-gray-300'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-black/5 dark:border-white/10">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Activity</h3>
                      <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {logs.map((log) => (
                          <div key={log.id} className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0 mt-1">
                              {log.type === 'MemberAdded' ? <Plus size={14} className="text-green-500" /> :
                               log.type === 'MemberUpdated' ? <Users size={14} className="text-blue-500" /> :
                               log.type === 'PlanUpdated' ? <CreditCard size={14} className="text-brand-red" /> :
                               <LayoutDashboard size={14} className="text-gray-500" />}
                            </div>
                            <div>
                              <p className="text-sm text-gray-700 dark:text-gray-200">{log.message}</p>
                              <p className="text-xs text-gray-500">{formatTimeAgo(log.date)}</p>
                            </div>
                          </div>
                        ))}
                        {logs.length === 0 && (
                          <p className="text-sm text-gray-500 italic">No recent activity found.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attendance Detail Modal */}
      <AnimatePresence>
        {attendanceModalMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAttendanceModalMemberId(null)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-4xl p-0 relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/5 dark:bg-black/40">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-2xl font-bold shadow-lg relative">
                    {attendanceModalMember.name[0]}
                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-black ${
                      attendanceModalMember.attendance?.[new Date().toISOString().split('T')[0]] ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{attendanceModalMember.name}</h2>
                    <p className="text-gray-400">{attendanceModalMember.plan} Plan • Joined {attendanceModalMember.joinDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      setEditingMember(attendanceModalMember);
                      setIsAddModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-brand-red text-white font-bold hover:bg-brand-red/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Edit Profile
                  </button>
                  <button 
                    onClick={() => {
                      setAttendanceModalMemberId(null);
                      setMemberModalTab('overview');
                    }}
                    className="text-gray-400 hover:text-black dark:hover:text-white p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/20">
                {['overview', 'attendance', 'progress', 'payments'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMemberModalTab(tab as any)}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
                      memberModalTab === tab 
                        ? 'text-brand-red' 
                        : 'text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {tab}
                    {memberModalTab === tab && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-brand-red"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {memberModalTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Member Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 border border-black/5 dark:border-white/10">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Personal Information</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Email</span>
                            <span className="font-bold">{attendanceModalMember.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Phone</span>
                            <span className="font-bold">{attendanceModalMember.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Location</span>
                            <span className="font-bold">{attendanceModalMember.location || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 border border-black/5 dark:border-white/10">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Membership Status</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Current Plan</span>
                            <span className="px-3 py-1 rounded-full bg-brand-red/10 text-brand-red font-bold text-xs">
                              {attendanceModalMember.plan}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Expiry Date</span>
                            <span className={`font-bold ${
                              new Date(attendanceModalMember.expiryDate) < new Date() ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {attendanceModalMember.expiryDate}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Join Date</span>
                            <span className="font-bold">{attendanceModalMember.joinDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 border border-black/5 dark:border-white/10">
                        <div className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-bold">Overall Attendance</div>
                        <div className="text-4xl font-bold text-black dark:text-white flex items-baseline gap-2">
                          {(() => {
                            const totalDays = Object.keys(attendanceModalMember.attendance || {}).length;
                            const presentDays = Object.values(attendanceModalMember.attendance || {}).filter(Boolean).length;
                            return totalDays ? Math.round((presentDays / totalDays) * 100) : 0;
                          })()}%
                        </div>
                      </div>
                      <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 border border-black/5 dark:border-white/10">
                        <div className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-bold">Total Days Attended</div>
                        <div className="text-4xl font-bold text-black dark:text-white">
                          {Object.values(attendanceModalMember.attendance || {}).filter(Boolean).length}
                        </div>
                      </div>
                      <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 border border-black/5 dark:border-white/10">
                        <div className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-bold">Months Active</div>
                        <div className="text-4xl font-bold text-black dark:text-white">
                          {(() => {
                            const joinDate = new Date(attendanceModalMember.joinDate);
                            const now = new Date();
                            return (now.getFullYear() - joinDate.getFullYear()) * 12 + now.getMonth() - joinDate.getMonth() + 1;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {memberModalTab === 'attendance' && (
                  <div className="space-y-8">
                    {/* Calendar Section */}
                    <div className="bg-black/5 dark:bg-black/20 rounded-3xl p-6 border border-black/5 dark:border-white/5">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold">Attendance Calendar</h3>
                        <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 rounded-full p-1">
                          <button 
                            onClick={() => {
                              const newDate = new Date(attendanceMonth);
                              newDate.setMonth(newDate.getMonth() - 1);
                              setAttendanceMonth(newDate);
                            }}
                            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <span className="font-bold min-w-[120px] text-center">
                            {attendanceMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </span>
                          <button 
                            onClick={() => {
                              const newDate = new Date(attendanceMonth);
                              newDate.setMonth(newDate.getMonth() + 1);
                              if (newDate <= new Date()) {
                                setAttendanceMonth(newDate);
                              }
                            }}
                            disabled={attendanceMonth.getMonth() === new Date().getMonth() && attendanceMonth.getFullYear() === new Date().getFullYear()}
                            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {(() => {
                          const year = attendanceMonth.getFullYear();
                          const month = attendanceMonth.getMonth();
                          const firstDay = new Date(year, month, 1).getDay();
                          const daysInMonth = new Date(year, month + 1, 0).getDate();
                          const today = new Date();
                          
                          const days = [];
                          for (let i = 0; i < firstDay; i++) {
                            days.push(<div key={`empty-${i}`} className="aspect-square" />);
                          }
                          
                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(year, month, day);
                            const dateStr = date.toISOString().split('T')[0];
                            const isFuture = date > today;
                            const isPresent = attendanceModalMember.attendance?.[dateStr];
                            const isToday = date.toDateString() === today.toDateString();
                            
                            days.push(
                              <button
                                key={day}
                                disabled={isFuture}
                                onClick={() => handleToggleAttendance(attendanceModalMember.id, dateStr)}
                                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all relative group overflow-hidden ${
                                  isFuture ? 'opacity-20 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'
                                } ${
                                  isPresent ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                                  !isFuture ? 'bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10' : ''
                                } ${
                                  isToday ? 'ring-2 ring-brand-red ring-offset-2 ring-offset-white dark:ring-offset-black' : ''
                                }`}
                              >
                                <span className="relative z-10">{day}</span>
                                {isPresent && (
                                  <motion.div 
                                    layoutId={`check-${dateStr}`}
                                    className="absolute inset-0 bg-green-500/10"
                                  />
                                )}
                              </button>
                            );
                          }
                          return days;
                        })()}
                      </div>

                      {/* Monthly Rate Bar */}
                      <div className="mt-8">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Monthly Rate</span>
                          <span className="font-bold">
                            {(() => {
                              const year = attendanceMonth.getFullYear();
                              const month = attendanceMonth.getMonth();
                              const daysInMonth = new Date(year, month + 1, 0).getDate();
                              let presentCount = 0;
                              let pastDaysCount = 0;
                              const today = new Date();
                              
                              for (let day = 1; day <= daysInMonth; day++) {
                                const date = new Date(year, month, day);
                                if (date <= today) {
                                  pastDaysCount++;
                                  if (attendanceModalMember.attendance?.[date.toISOString().split('T')[0]]) {
                                    presentCount++;
                                  }
                                }
                              }
                              
                              const rate = pastDaysCount ? Math.round((presentCount / pastDaysCount) * 100) : 0;
                              return `${rate}%`;
                            })()}
                          </span>
                        </div>
                        <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: (() => {
                                const year = attendanceMonth.getFullYear();
                                const month = attendanceMonth.getMonth();
                                const daysInMonth = new Date(year, month + 1, 0).getDate();
                                let presentCount = 0;
                                let pastDaysCount = 0;
                                const today = new Date();
                                
                                for (let day = 1; day <= daysInMonth; day++) {
                                  const date = new Date(year, month, day);
                                  if (date <= today) {
                                    pastDaysCount++;
                                    if (attendanceModalMember.attendance?.[date.toISOString().split('T')[0]]) {
                                      presentCount++;
                                    }
                                  }
                                }
                                return `${pastDaysCount ? Math.round((presentCount / pastDaysCount) * 100) : 0}%`;
                              })()
                            }}
                            className={`h-full ${
                              (() => {
                                const year = attendanceMonth.getFullYear();
                                const month = attendanceMonth.getMonth();
                                const daysInMonth = new Date(year, month + 1, 0).getDate();
                                let presentCount = 0;
                                let pastDaysCount = 0;
                                const today = new Date();
                                
                                for (let day = 1; day <= daysInMonth; day++) {
                                  const date = new Date(year, month, day);
                                  if (date <= today) {
                                    pastDaysCount++;
                                    if (attendanceModalMember.attendance?.[date.toISOString().split('T')[0]]) {
                                      presentCount++;
                                    }
                                  }
                                }
                                const rate = pastDaysCount ? Math.round((presentCount / pastDaysCount) * 100) : 0;
                                if (rate >= 80) return 'bg-green-500';
                                if (rate >= 50) return 'bg-yellow-500';
                                return 'bg-red-500';
                              })()
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {memberModalTab === 'progress' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Progress History</h3>
                    </div>
                    {selectedMemberProgress.length > 0 ? (
                      <div className="space-y-4">
                        {selectedMemberProgress.map((record, idx) => (
                          <div key={idx} className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 border border-black/5 dark:border-white/10">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-brand-red font-bold">{record.date}</span>
                              <span className="text-gray-400 text-sm">{record.weight} kg</span>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-gray-400 text-xs uppercase mb-1">Chest</div>
                                <div className="font-bold">{record.measurements?.chest || '-'}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-400 text-xs uppercase mb-1">Waist</div>
                                <div className="font-bold">{record.measurements?.waist || '-'}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-400 text-xs uppercase mb-1">Hips</div>
                                <div className="font-bold">{record.measurements?.hips || '-'}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-400 text-xs uppercase mb-1">Arms</div>
                                <div className="font-bold">{record.measurements?.arms || '-'}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
                        <p className="text-gray-400">No progress records found for this member.</p>
                      </div>
                    )}
                  </div>
                )}

                {memberModalTab === 'payments' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Payment History</h3>
                    </div>
                    {selectedMemberPayments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedMemberPayments.map((payment, idx) => (
                          <div key={idx} className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 border border-black/5 dark:border-white/10 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-lg">₹{payment.amount}</div>
                              <div className="text-gray-400 text-xs">{payment.plan} • {payment.date}</div>
                            </div>
                            <div className="text-right">
                              <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 font-bold text-xs uppercase mb-1">
                                {payment.status}
                              </div>
                              <div className="text-gray-400 text-xs">{payment.method}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
                        <p className="text-gray-400">No payment records found for this member.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Profile Modal */}
      <AnimatePresence>
        {isMemberProfileModalOpen && memberProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMemberProfileModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md p-0 relative z-10 overflow-hidden"
            >
              <div className="h-24 bg-gradient-to-r from-brand-red to-red-900 relative">
                <button 
                  onClick={() => setIsMemberProfileModalOpen(false)} 
                  className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-md transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="px-6 pb-8">
                <div className="relative flex justify-center -mt-10 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-3xl font-bold border-4 border-white dark:border-[#1a1a1a] shadow-xl overflow-hidden">
                    {memberProfile.name[0]}
                  </div>
                </div>

                <div className="text-center space-y-1 mb-8">
                  <h2 className="text-2xl font-bold">{memberProfile.name}</h2>
                  <p className="text-brand-red font-medium">{memberProfile.plan} Member</p>
                  <p className="text-sm text-gray-500">{memberProfile.email}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-brand-red" />
                      <span className="text-sm font-medium">{memberProfile.phone}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-black/5 dark:border-white/10">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Preferences</h3>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        {isDarkMode ? <Moon size={20} className="text-brand-red" /> : <Sun size={20} className="text-brand-red" />}
                        <div>
                          <p className="text-sm font-bold">Dark Mode</p>
                          <p className="text-xs text-gray-400">Toggle application theme</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-brand-red' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full mt-8 py-3 rounded-xl border border-red-500/20 text-red-500 font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
