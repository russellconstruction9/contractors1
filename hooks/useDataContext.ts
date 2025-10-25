import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Project, Task, User, TimeLog, TaskStatus, Location, PunchListItem, ProjectPhoto, InventoryItem, OrderListItem, InventoryOrderItem, ManualOrderItem, ProjectType, MaterialLog, Invoice, InvoiceLineItem } from '../types';
import { setPhoto, getPhoto } from '../utils/db';
import { addDays, subDays } from 'date-fns';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAyS8VmIL-AbFnpm_xmuKZ-XG8AmSA03AM';

// Helper function to revive dates from JSON strings
const reviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
        return new Date(value);
    }
    return value;
};

// Generic function to get item from localStorage
const getStoredItem = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        // If item doesn't exist, return the default value to populate the app
        if (item === null) {
            return defaultValue;
        }
        return JSON.parse(item, reviver);
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return defaultValue;
    }
};

// Fetches the map image and converts it to a Data URL to embed it directly.
// This is more reliable for PDF generation as it avoids cross-origin issues.
const getMapImageDataUrl = async (location: Location): Promise<string | undefined> => {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=200x150&markers=color:red%7C${location.lat},${location.lng}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch map image: ${response.statusText}`);
            return undefined;
        }
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error fetching or converting map image:", error);
        return undefined;
    }
};

// --- DEFAULT DATA FOR PRE-LOADING THE APP ---
const defaultUsers: User[] = [
  {
    id: 1,
    name: 'Ryan',
    role: 'Installer',
    avatarUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
    isClockedIn: false,
    hourlyRate: 25,
  }
];

const todayForDefaults = new Date();

const defaultProjects: Project[] = [
    {
        id: 1,
        name: 'Sally Wertman',
        address: '23296 US 12 W, Sturgis, MI 49091',
        type: ProjectType.Renovation,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 60),
        endDate: addDays(todayForDefaults, 90),
        budget: 150000,
        currentSpend: 45000,
        markupPercent: 20,
        punchList: [
            { id: 1, text: 'Fix front door lock', isComplete: false, photos: [] },
            { id: 2, text: 'Paint trim in living room', isComplete: true, photos: [] },
            { id: 3, text: 'Repair drywall patch in hallway', isComplete: false, photos: [] },
        ],
        photos: [],
    },
    {
        id: 2,
        name: 'Tony Szafranski',
        address: '1370 E 720 S, Wolcottville, IN 46795',
        type: ProjectType.NewConstruction,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 45),
        endDate: addDays(todayForDefaults, 120),
        budget: 320000,
        currentSpend: 80000,
        markupPercent: 15,
        punchList: [
             { id: 4, text: 'Install kitchen backsplash', isComplete: false, photos: [] },
        ],
        photos: [],
    },
    {
        id: 3,
        name: 'Joe Eicher',
        address: '6430 S 125 E, Wolcottville, IN 46795',
        type: ProjectType.InteriorFitOut,
        status: 'On Hold',
        startDate: subDays(todayForDefaults, 90),
        endDate: addDays(todayForDefaults, 60),
        budget: 75000,
        currentSpend: 25000,
        markupPercent: 25,
        punchList: [],
        photos: [],
    },
    {
        id: 4,
        name: 'Tyler Mitchell',
        address: '785 E 660 S, Wolcottville, IN 46795',
        type: ProjectType.NewConstruction,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 15),
        endDate: addDays(todayForDefaults, 180),
        budget: 450000,
        currentSpend: 15000,
        markupPercent: 20,
        punchList: [],
        photos: [],
    },
    {
        id: 5,
        name: 'Dennis Zmyslo',
        address: '260 Spring Beach Rd, Rome City, IN 46784',
        type: ProjectType.Renovation,
        status: 'Completed',
        startDate: subDays(todayForDefaults, 180),
        endDate: subDays(todayForDefaults, 10),
        budget: 95000,
        currentSpend: 92500,
        markupPercent: 20,
        punchList: [],
        photos: [],
    },
    {
        id: 6,
        name: 'Stephanie Webster',
        address: '803 South Main Street, Topeka, IN 46571',
        type: ProjectType.Demolition,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 5),
        endDate: addDays(todayForDefaults, 25),
        budget: 25000,
        currentSpend: 5000,
        markupPercent: 30,
        punchList: [],
        photos: [],
    }
];


interface DataContextType {
  users: User[];
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];
  inventory: InventoryItem[];
  orderList: OrderListItem[];
  materialLogs: MaterialLog[];
  invoices: Invoice[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: { name: string; role: string; hourlyRate: number; }) => void;
  updateUser: (userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => void;
  addProject: (project: Omit<Project, 'id' | 'currentSpend' | 'punchList' | 'photos'>) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTaskStatus: (taskId: number, status: TaskStatus) => void;
  toggleClockInOut: (projectId?: number) => void;
  switchJob: (newProjectId: number) => void;
  addPunchListItem: (projectId: number, text: string) => void;
  togglePunchListItem: (projectId: number, itemId: number) => void;
  addPhoto: (projectId: number, imageDataUrls: string[], description: string) => Promise<void>;
  addPhotoToPunchListItem: (projectId: number, punchListItemId: number, imageDataUrls: string[], description: string) => Promise<void>;
  updatePunchListPhoto: (projectId: number, punchListItemId: number, photoId: number, newImageDataUrl: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItemQuantity: (itemId: number, newQuantity: number) => void;
  updateInventoryItem: (itemId: number, data: Partial<Omit<InventoryItem, 'id' | 'quantity'>>) => void;
  addToOrderList: (itemId: number) => void;
  addManualItemToOrderList: (name: string) => void;
  removeFromOrderList: (item: OrderListItem) => void;
  clearOrderList: () => void;
  logMaterialUsage: (projectId: number, inventoryItemId: number, quantityUsed: number) => void;
  logMaterialsFromReceipt: (projectId: number, items: { description: string; quantity: number; unitPrice: number; totalPrice: number; }[], receiptPhotoId: string) => void;
  generateInvoice: (projectId: number) => void;
  updateInvoiceStatus: (invoiceId: number, status: Invoice['status']) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => getStoredItem('scc_users', defaultUsers));
  const [projects, setProjects] = useState<Project[]>(() => getStoredItem('scc_projects', defaultProjects));
  const [tasks, setTasks] = useState<Task[]>(() => getStoredItem('scc_tasks', []));
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => getStoredItem('scc_timeLogs', []));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStoredItem('scc_inventory', []));
  const [orderList, setOrderList] = useState<OrderListItem[]>(() => getStoredItem('scc_orderList', []));
  const [materialLogs, setMaterialLogs] = useState<MaterialLog[]>(() => getStoredItem('scc_materialLogs', []));
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredItem('scc_invoices', []));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredItem('scc_currentUser', null));

  // Persist state to localStorage on changes
  useEffect(() => { localStorage.setItem('scc_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('scc_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('scc_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('scc_timeLogs', JSON.stringify(timeLogs)); }, [timeLogs]);
  useEffect(() => { localStorage.setItem('scc_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('scc_orderList', JSON.stringify(orderList)); }, [orderList]);
  useEffect(() => { localStorage.setItem('scc_materialLogs', JSON.stringify(materialLogs)); }, [materialLogs]);
  useEffect(() => { localStorage.setItem('scc_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('scc_currentUser', JSON.stringify(currentUser)); }, [currentUser]);

  useEffect(() => {
    if (users.length > 0 && !currentUser) {
        const storedUser = getStoredItem<User | null>('scc_currentUser', null);
        const userExists = storedUser ? users.some(u => u.id === storedUser.id) : false;
        setCurrentUser(userExists ? storedUser : users[0]);
    }
    if (users.length === 0 && currentUser) {
        setCurrentUser(null);
    }
  }, [users, currentUser]);

  const addUser = useCallback(({ name, role, hourlyRate }: { name: string; role: string; hourlyRate: number; }) => {
    setUsers(prev => {
        const newUser: User = {
          id: Math.max(0, ...prev.map(u => u.id)) + 1,
          name,
          role,
          hourlyRate,
          avatarUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
          isClockedIn: false,
        };
        return [...prev, newUser]
    });
  }, []);

  const updateUser = useCallback((userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => {
      let updatedUser: User | null = null;
      setUsers(prev => prev.map(user => {
          if (user.id === userId) {
              updatedUser = { ...user, ...data };
              return updatedUser;
          }
          return user;
      }));
      if (currentUser?.id === userId && updatedUser) {
          setCurrentUser(updatedUser);
      }
  }, [currentUser]);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'currentSpend' | 'punchList' | 'photos'>) => {
    setProjects(prev => {
        const newProject: Project = {
            ...projectData,
            id: Math.max(0, ...prev.map(p => p.id)) + 1,
            currentSpend: 0,
            punchList: [],
            photos: [],
        };
        return [...prev, newProject];
    });
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'status'>) => {
    setTasks(prev => {
        const newTask: Task = {
            ...taskData,
            id: Math.max(0, ...prev.map(t => t.id)) + 1,
            status: TaskStatus.ToDo,
        };
        return [...prev, newTask]
    });
  }, []);

  const updateTaskStatus = useCallback((taskId: number, status: TaskStatus) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status } : task));
  }, []);

  const getCurrentLocation = useCallback((): Promise<Location | undefined> => {
      return new Promise((resolve) => {
          if (!navigator.geolocation) { 
            console.warn("Geolocation is not supported by this browser.");
            resolve(undefined);
            return;
           }
          navigator.geolocation.getCurrentPosition(
              (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
              (error) => {
                console.error("Error getting location:", error);
                alert(`Could not get location: ${error.message}`);
                resolve(undefined);
              }
          );
      });
  }, []);

  const toggleClockInOut = useCallback(async (projectId?: number) => {
    if (!currentUser) return;

    if (currentUser.isClockedIn) {
      const location = await getCurrentLocation();
      const clockInTime = currentUser.clockInTime;
      if (!clockInTime) return;
      
      const existingLogIndex = timeLogs.findIndex(log => log.userId === currentUser.id && !log.clockOut);
      if (existingLogIndex === -1) return;

      const now = new Date();
      const durationMs = now.getTime() - clockInTime.getTime();
      const hoursWorked = durationMs / (1000 * 60 * 60);
      const cost = hoursWorked * currentUser.hourlyRate;
      const mapImageUrl = location ? await getMapImageDataUrl(location) : undefined;
      
      const updatedLog: TimeLog = { 
        ...timeLogs[existingLogIndex], 
        clockOut: now, 
        durationMs, 
        cost, 
        clockOutLocation: location,
        clockOutMapImage: mapImageUrl
      };
      const newTimeLogs = [...timeLogs];
      newTimeLogs[existingLogIndex] = updatedLog;

      setTimeLogs(newTimeLogs.sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime()));
      
      const updatedUser = { ...currentUser, isClockedIn: false, clockInTime: undefined, currentProjectId: undefined };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

      const clockedOutProjectId = timeLogs[existingLogIndex].projectId;
      setProjects(prev => prev.map(p => p.id === clockedOutProjectId ? { ...p, currentSpend: p.currentSpend + cost } : p));
    } else {
      if (!projectId) return;
      const location = await getCurrentLocation();
      const mapImageUrl = location ? await getMapImageDataUrl(location) : undefined;
      const clockInTime = new Date();
      const updatedUser = { ...currentUser, isClockedIn: true, clockInTime, currentProjectId: projectId };
      
      const newLog: TimeLog = { 
        id: Math.max(0, ...timeLogs.map(l => l.id)) + 1, 
        userId: currentUser.id, 
        projectId: projectId, 
        clockIn: clockInTime, 
        clockInLocation: location,
        clockInMapImage: mapImageUrl
      };
      setTimeLogs(prev => [newLog, ...prev]);

      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    }
  }, [currentUser, timeLogs, projects, getCurrentLocation]);

  const switchJob = useCallback(async (newProjectId: number) => {
    if (!currentUser || !currentUser.isClockedIn) return;
    if (newProjectId === currentUser.currentProjectId) return;

    // Step 1: Clock out from the current job.
    const location = await getCurrentLocation();
    const clockInTime = currentUser.clockInTime;
    if (!clockInTime) return;
    
    const existingLogIndex = timeLogs.findIndex(log => log.userId === currentUser.id && !log.clockOut);
    if (existingLogIndex === -1) return;

    const now = new Date();
    const durationMs = now.getTime() - clockInTime.getTime();
    const hoursWorked = durationMs / (1000 * 60 * 60);
    const cost = hoursWorked * currentUser.hourlyRate;
    const mapImageUrl = location ? await getMapImageDataUrl(location) : undefined;
    
    const updatedLog: TimeLog = { 
      ...timeLogs[existingLogIndex], 
      clockOut: now, 
      durationMs, 
      cost, 
      clockOutLocation: location,
      clockOutMapImage: mapImageUrl
    };
    
    const tempTimeLogs = [...timeLogs];
    tempTimeLogs[existingLogIndex] = updatedLog;

    const clockedOutProjectId = timeLogs[existingLogIndex].projectId;
    const tempProjects = projects.map(p => p.id === clockedOutProjectId ? { ...p, currentSpend: p.currentSpend + cost } : p);

    // Step 2: Clock in to the new job immediately.
    const newLocation = await getCurrentLocation();
    const newMapImageUrl = newLocation ? await getMapImageDataUrl(newLocation) : undefined;
    const newClockInTime = new Date(); // Use a fresh timestamp for accuracy
    const updatedUser = { ...currentUser, isClockedIn: true, clockInTime: newClockInTime, currentProjectId: newProjectId };
    const newLog: TimeLog = { 
      id: Math.max(0, ...tempTimeLogs.map(l => l.id)) + 1, 
      userId: currentUser.id, 
      projectId: newProjectId, 
      clockIn: newClockInTime, 
      clockInLocation: newLocation,
      clockInMapImage: newMapImageUrl
    };
    
    setTimeLogs([newLog, ...tempTimeLogs].sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime()));
    setProjects(tempProjects);
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  }, [currentUser, timeLogs, projects, getCurrentLocation]);

  const addPunchListItem = useCallback((projectId: number, text: string) => {
    setProjects(prevProjects => {
        // Find the highest existing ID across all punch lists in all projects.
        const allItems = prevProjects.flatMap(p => p.punchList);
        const nextId = Math.max(0, ...allItems.map(item => item.id)) + 1;

        // Create the new item with a globally unique ID.
        const newItem: PunchListItem = {
            id: nextId,
            text,
            isComplete: false,
            photos: [],
        };

        // Update only the target project's punch list.
        return prevProjects.map(p =>
            p.id === projectId
                ? { ...p, punchList: [...p.punchList, newItem] }
                : p
        );
    });
  }, []);

  const togglePunchListItem = useCallback((projectId: number, itemId: number) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, punchList: p.punchList.map(item => item.id === itemId ? { ...item, isComplete: !item.isComplete } : item) } : p));
  }, []);

  const addPhoto = useCallback(async (projectId: number, imageDataUrls: string[], description: string) => {
    setProjects(prev => {
        const project = prev.find(p => p.id === projectId);
        if (!project) return prev;
    
        const dateAdded = new Date();
        let nextId = Math.max(0, ...project.photos.map(p => p.id)) + 1;
        
        const newPhotos: Omit<ProjectPhoto, 'imageDataUrl'>[] = [];
        
        imageDataUrls.forEach((url) => {
            const photoId = nextId++;
            const newPhoto: Omit<ProjectPhoto, 'imageDataUrl'> = {
              id: photoId,
              description,
              dateAdded, // same timestamp for the batch
            };
            newPhotos.push(newPhoto);
    
            setPhoto(`proj-${projectId}-${newPhoto.id}`, url).catch(e => {
                console.error("Failed to add photo", e);
                alert("There was an error saving the photo. The storage might be full.");
            });
        });

        const updatedPhotos = [...newPhotos, ...project.photos];

        return prev.map(p => p.id === projectId ? { ...p, photos: updatedPhotos } : p);
    });
  }, []);

  const addPhotoToPunchListItem = useCallback(async (projectId: number, punchListItemId: number, imageDataUrls: string[], description: string) => {
    setProjects(prev => {
        const project = prev.find(p => p.id === projectId);
        const punchListItem = project?.punchList.find(item => item.id === punchListItemId);
        if (!project || !punchListItem) return prev;

        const dateAdded = new Date();
        let nextId = Math.max(0, ...punchListItem.photos.map(p => p.id)) + 1;
        
        const newPhotos: Omit<ProjectPhoto, 'imageDataUrl'>[] = [];
        
        imageDataUrls.forEach((url) => {
            const photoId = nextId++;
            const newPhoto: Omit<ProjectPhoto, 'imageDataUrl'> = {
              id: photoId,
              description,
              dateAdded,
            };
            newPhotos.push(newPhoto);
    
            const key = `punch-${projectId}-${punchListItemId}-${photoId}`;
            setPhoto(key, url).catch(e => {
                console.error("Failed to add punch list photo", e);
                alert("There was an error saving the photo.");
            });
        });
        
        const updatedPunchListItem = { ...punchListItem, photos: [...newPhotos, ...punchListItem.photos] };
        const updatedPunchList = project.punchList.map(item => item.id === punchListItemId ? updatedPunchListItem : item);
        return prev.map(p => p.id === projectId ? { ...p, punchList: updatedPunchList } : p);
    });
  }, []);
  
  const updatePunchListPhoto = useCallback(async (projectId: number, punchListItemId: number, photoId: number, newImageDataUrl: string) => {
      try {
        const key = `punch-${projectId}-${punchListItemId}-${photoId}`;
        await setPhoto(key, newImageDataUrl);
      } catch (error) {
         console.error("Failed to update punch list photo", error);
         alert("There was an error saving your changes.");
      }
  }, []);


  const addInventoryItem = useCallback((itemData: Omit<InventoryItem, 'id'>) => {
    setInventory(prev => {
        const newItem: InventoryItem = {
            ...itemData,
            id: Math.max(0, ...prev.map(i => i.id)) + 1,
        };
        return [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name));
    });
  }, []);

  const updateInventoryItemQuantity = useCallback((itemId: number, newQuantity: number) => {
      setInventory(prev => prev.map(item => item.id === itemId ? { ...item, quantity: Math.max(0, newQuantity) } : item));
  }, []);

  const updateInventoryItem = useCallback((itemId: number, data: Partial<Omit<InventoryItem, 'id' | 'quantity'>>) => {
    setInventory(prev => prev.map(item => item.id === itemId ? { ...item, ...data } : item));
  }, []);

  const addToOrderList = useCallback((itemId: number) => {
    setOrderList(prev => {
        const exists = prev.some(item => item.type === 'inventory' && item.itemId === itemId);
        if (exists) return prev;
        const newItem: InventoryOrderItem = { type: 'inventory', itemId };
        return [...prev, newItem];
    });
  }, []);

  const addManualItemToOrderList = useCallback((name: string) => {
    setOrderList(prev => {
        const manualOrderItems = prev.filter(item => item.type === 'manual') as ManualOrderItem[];
        const newId = Math.max(0, ...manualOrderItems.map(i => i.id)) + 1;
        const newItem: ManualOrderItem = { type: 'manual', id: newId, name };
        return [...prev, newItem];
    });
  }, []);

  const removeFromOrderList = useCallback((itemToRemove: OrderListItem) => {
    setOrderList(prev => prev.filter(item => {
        if (item.type !== itemToRemove.type) return true;
        if (item.type === 'inventory' && itemToRemove.type === 'inventory') {
            return item.itemId !== itemToRemove.itemId;
        }
        if (item.type === 'manual' && itemToRemove.type === 'manual') {
            return item.id !== itemToRemove.id;
        }
        return true;
    }));
  }, []);

  const clearOrderList = useCallback(() => {
    setOrderList([]);
  }, []);

  const logMaterialUsage = useCallback((projectId: number, inventoryItemId: number, quantityUsed: number) => {
    const item = inventory.find(i => i.id === inventoryItemId);
    if (!item || item.quantity < quantityUsed) {
        alert("Not enough inventory in stock.");
        return;
    }

    // Deduct from inventory
    updateInventoryItemQuantity(inventoryItemId, item.quantity - quantityUsed);

    // Add to material log
    const costAtTime = item.cost * quantityUsed;
    const newLog: MaterialLog = {
        id: Math.max(0, ...materialLogs.map(l => l.id)) + 1,
        projectId,
        inventoryItemId,
        description: item.name,
        quantityUsed,
        unitCost: item.cost,
        costAtTime,
        dateUsed: new Date(),
    };
    setMaterialLogs(prev => [...prev, newLog]);

    // Update project's current spend
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, currentSpend: p.currentSpend + costAtTime } : p));

  }, [inventory, materialLogs, updateInventoryItemQuantity]);
  
  const logMaterialsFromReceipt = useCallback((
    projectId: number, 
    items: { description: string; quantity: number; unitPrice: number; totalPrice: number; }[], 
    receiptPhotoId: string
  ) => {
      let totalCostFromReceipt = 0;

      const newLogs: Omit<MaterialLog, 'id'>[] = items.map(item => {
          totalCostFromReceipt += item.totalPrice;
          return {
              projectId,
              description: item.description,
              quantityUsed: item.quantity,
              unitCost: item.unitPrice,
              costAtTime: item.totalPrice,
              dateUsed: new Date(),
              receiptPhotoId,
          };
      });

      setMaterialLogs(prev => {
          let nextId = Math.max(0, ...prev.map(l => l.id)) + 1;
          const logsWithIds = newLogs.map(log => ({ ...log, id: nextId++ }));
          return [...prev, ...logsWithIds].sort((a,b) => b.dateUsed.getTime() - a.dateUsed.getTime());
      });

      setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, currentSpend: p.currentSpend + totalCostFromReceipt } : p
      ));
  }, []);


  const generateInvoice = useCallback((projectId: number) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const uninvoicedTimeLogs = timeLogs.filter(log => log.projectId === projectId && !log.invoiceId && log.clockOut);
      const uninvoicedMaterialLogs = materialLogs.filter(log => log.projectId === projectId && !log.invoiceId);
      
      if (uninvoicedTimeLogs.length === 0 && uninvoicedMaterialLogs.length === 0) {
          alert("No new billable hours or materials to invoice for this project.");
          return;
      }
      
      const nextId = Math.max(0, ...invoices.map(i => i.id)) + 1;
      const projectInvoices = invoices.filter(i => i.projectId === projectId);
      const invoiceNumber = `${project.id}-${String(projectInvoices.length + 1).padStart(3, '0')}`;

      // Process Labor
      const laborLineItems: InvoiceLineItem[] = uninvoicedTimeLogs.map(log => {
        const user = users.find(u => u.id === log.userId);
        const hours = (log.durationMs || 0) / (1000 * 60 * 60);
        return {
            description: `Labor: ${user?.name || 'Unknown'} on ${log.clockIn.toLocaleDateString()}`,
            quantity: parseFloat(hours.toFixed(2)),
            unitPrice: user?.hourlyRate || 0,
            total: log.cost || 0,
        };
      });
      const totalLaborCost = laborLineItems.reduce((acc, item) => acc + item.total, 0);

      // Process Materials
      const materialLineItems: InvoiceLineItem[] = uninvoicedMaterialLogs.map(log => {
        return {
            description: log.description,
            quantity: log.quantityUsed,
            unitPrice: log.unitCost,
            total: log.costAtTime,
        };
      });
      const totalMaterialCost = materialLineItems.reduce((acc, item) => acc + item.total, 0);
      
      const subtotal = totalLaborCost + totalMaterialCost;
      const markupAmount = subtotal * (project.markupPercent / 100);
      const totalAmount = subtotal + markupAmount;

      const newInvoice: Invoice = {
        id: nextId,
        invoiceNumber,
        projectId,
        issueDate: new Date(),
        dueDate: addDays(new Date(), 30),
        status: 'Draft',
        laborLineItems,
        materialLineItems,
        subtotal,
        markupAmount,
        totalAmount,
      };
      
      setInvoices(prev => [...prev, newInvoice].sort((a,b) => b.issueDate.getTime() - a.issueDate.getTime()));
      // Mark logs as invoiced
      setTimeLogs(prev => prev.map(log => uninvoicedTimeLogs.some(ul => ul.id === log.id) ? { ...log, invoiceId: nextId } : log));
      setMaterialLogs(prev => prev.map(log => uninvoicedMaterialLogs.some(ul => ul.id === log.id) ? { ...log, invoiceId: nextId } : log));

  }, [projects, timeLogs, materialLogs, invoices, users]);

  const updateInvoiceStatus = useCallback((invoiceId: number, status: Invoice['status']) => {
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status } : inv));
  }, []);


  const value = useMemo(() => ({ 
      users, projects, tasks, timeLogs, inventory, orderList, materialLogs, invoices, currentUser, 
      setCurrentUser, addUser, updateUser, addProject, addTask, updateTaskStatus, 
      toggleClockInOut, switchJob, addPunchListItem, togglePunchListItem, addPhoto, 
      addPhotoToPunchListItem, updatePunchListPhoto,
      addInventoryItem, updateInventoryItemQuantity, updateInventoryItem, addToOrderList, 
      addManualItemToOrderList, removeFromOrderList, clearOrderList,
      logMaterialUsage, logMaterialsFromReceipt, generateInvoice, updateInvoiceStatus,
  }), [
      users, projects, tasks, timeLogs, inventory, orderList, materialLogs, invoices, currentUser,
      addUser, updateUser, addProject, addTask, updateTaskStatus, toggleClockInOut,
      switchJob, addPunchListItem, togglePunchListItem, addPhoto, addPhotoToPunchListItem, 
      updatePunchListPhoto, addInventoryItem,
      updateInventoryItemQuantity, updateInventoryItem, addToOrderList, addManualItemToOrderList,
      removeFromOrderList, clearOrderList, logMaterialUsage, logMaterialsFromReceipt, generateInvoice, updateInvoiceStatus
  ]);

  return React.createElement(DataContext.Provider, { value }, children);
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) { throw new Error('useData must be used within a DataProvider'); }
  return context;
};