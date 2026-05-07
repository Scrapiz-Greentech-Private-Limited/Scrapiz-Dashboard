'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Send,
  History,
  Loader2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Search,
  Smartphone,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotificationService, type PushNotificationPayload, type NotificationHistoryItem, type UserWithPushToken } from '@/components/backend/apiService';

const APP_TARGET_OPTIONS = [
  {
    value: 'client' as const,
    label: 'Scrapiz: sell Scrap online',
    description: 'Client application',
  },
  {
    value: 'vendor' as const,
    label: 'Scrapiz partner',
    description: 'Vendor application',
  },
] as const;

const APP_TARGET_LABELS: Record<'client' | 'vendor', string> = {
  client: 'Scrapiz: sell Scrap online',
  vendor: 'Scrapiz partner',
};

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [appTarget, setAppTarget] = useState<'client' | 'vendor'>('client');
  const [imageUrl, setImageUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [retrying, setRetrying] = useState<number | null>(null);
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [users, setUsers] = useState<UserWithPushToken[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithPushToken[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [titleError, setTitleError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [imageUrlError, setImageUrlError] = useState('');
  
  // Individual notification dialog state
  const [selectedUser, setSelectedUser] = useState<UserWithPushToken | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogCategory, setDialogCategory] = useState('general');
  const [dialogImageUrl, setDialogImageUrl] = useState('');
  const [dialogAppTarget, setDialogAppTarget] = useState<'client' | 'vendor'>('client');
  const [sendingToUser, setSendingToUser] = useState(false);
  
  const { toast } = useToast();

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getNotificationHistory();
      setHistory(data);
    } catch (error: any) {
      console.error('Failed to load notification history:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to load notification history' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const data = await NotificationService.getUsersWithPushTokens();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to load users' });
    } finally {
      setLoadingUsers(false);
    }
  }, [toast]);

  useEffect(() => {
    loadHistory();
    loadUsers();
  }, [loadHistory, loadUsers]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, users]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setTitleError(value.length > 50 ? `Title must be 50 characters or less (${value.length}/50)` : '');
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
    setMessageError(value.length > 200 ? `Message must be 200 characters or less (${value.length}/200)` : '');
  };

  const handleImageUrlChange = (value: string) => {
    setImageUrl(value);
    if (value && !isValidUrl(value)) {
      setImageUrlError('Please enter a valid URL');
    } else {
      setImageUrlError('');
    }
  };

  const isValidUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim() || title.length > 50 || message.length > 200 || (imageUrl && !isValidUrl(imageUrl))) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please check your input' });
      return;
    }
    try {
      setSending(true);
      const payload: PushNotificationPayload = { 
        title: title.trim(), 
        message: message.trim(), 
        category,
        app_target: appTarget,
        ...(imageUrl.trim() && { image_url: imageUrl.trim() })
      };
      const response = await NotificationService.sendPushNotification(payload);
      toast({ title: '🚀 Notification Sent!', description: response.message || 'Your push notification has been queued.' });
      setTitle(''); setMessage(''); setCategory('general'); setAppTarget('client'); setImageUrl(''); setTitleError(''); setMessageError(''); setImageUrlError('');
      setTimeout(() => loadHistory(), 2000);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to send push notification' });
    } finally {
      setSending(false);
    }
  };

  const handleRetryNotification = async (notificationId: number) => {
    try {
      setRetrying(notificationId);
      await NotificationService.retryNotification(notificationId);
      toast({ title: 'Retry Initiated', description: 'The notification retry has been queued.' });
      setTimeout(() => loadHistory(), 2000);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to retry notification' });
    } finally {
      setRetrying(null);
    }
  };

  const openSendDialog = (user: UserWithPushToken) => {
    setSelectedUser(user);
    setDialogTitle('');
    setDialogMessage('');
    setDialogCategory('general');
    setDialogImageUrl('');
    setDialogAppTarget('client');
    setDialogOpen(true);
  };

  const handleSendToUser = async () => {
    if (!selectedUser || !dialogTitle.trim() || !dialogMessage.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Title and message are required' });
      return;
    }
    if (dialogImageUrl && !isValidUrl(dialogImageUrl)) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please enter a valid image URL' });
      return;
    }
    try {
      setSendingToUser(true);
      const response = await NotificationService.sendToUser(selectedUser.id, {
        title: dialogTitle.trim(),
        message: dialogMessage.trim(),
        category: dialogCategory,
        app_target: dialogAppTarget,
        ...(dialogImageUrl.trim() && { image_url: dialogImageUrl.trim() })
      });
      toast({ title: '🚀 Notification Sent!', description: `Notification sent to ${selectedUser.email}` });
      setDialogOpen(false);
      setTimeout(() => loadHistory(), 2000);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to send notification' });
    } finally {
      setSendingToUser(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = { order_updates: 'Order Updates', promotions: 'Promotions', announcements: 'Announcements', general: 'General' };
    return labels[cat] || cat;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'sent': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="grid gap-4 sm:gap-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            Push Notification Center
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Send push notifications to all users or individual users based on their preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <Tabs defaultValue="send">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="send" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-1 sm:gap-2">
                <Send className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Broadcast</span>
                <span className="sm:hidden">Send</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-1 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-1 sm:gap-2">
                <History className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>History</span>
              </TabsTrigger>
            </TabsList>

            {/* Broadcast Tab */}
            <TabsContent value="send">
              <div className="grid gap-4 sm:gap-6 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {APP_TARGET_OPTIONS.map((option) => {
                    const active = appTarget === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAppTarget(option.value)}
                        className={`rounded-xl border p-4 text-left transition-all ${active ? 'border-green-500 bg-green-50 shadow-sm ring-2 ring-green-500/20' : 'border-border bg-background hover:border-green-300 hover:bg-muted/40'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sm sm:text-base">{option.label}</p>
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{option.description}</p>
                          </div>
                          <div className={`mt-0.5 h-3.5 w-3.5 rounded-full border ${active ? 'border-green-600 bg-green-600' : 'border-muted-foreground/40 bg-transparent'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
                <Alert className="text-xs sm:text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Notifications will be sent only to {APP_TARGET_LABELS[appTarget]}.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-2 sm:gap-3">
                  <Label htmlFor="title" className="text-sm">Title <span className="text-red-500">*</span></Label>
                  <Input id="title" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Enter notification title (max 50 characters)" maxLength={50} className={titleError ? 'border-red-500' : ''} />
                  <div className="flex justify-between text-xs">
                    {titleError ? <span className="text-red-500">{titleError}</span> : <span className="text-muted-foreground">{title.length}/50 characters</span>}
                  </div>
                </div>
                <div className="grid gap-2 sm:gap-3">
                  <Label htmlFor="message" className="text-sm">Message <span className="text-red-500">*</span></Label>
                  <Textarea id="message" value={message} onChange={(e) => handleMessageChange(e.target.value)} placeholder="Compose your message (max 200 characters)" className={`min-h-[100px] sm:min-h-[120px] ${messageError ? 'border-red-500' : ''}`} maxLength={200} />
                  <div className="flex justify-between text-xs">
                    {messageError ? <span className="text-red-500">{messageError}</span> : <span className="text-muted-foreground">{message.length}/200 characters</span>}
                  </div>
                </div>
                <div className="grid gap-2 sm:gap-3">
                  <Label htmlFor="category" className="text-sm">Category <span className="text-red-500">*</span></Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select notification category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="order_updates">Order Updates</SelectItem>
                      <SelectItem value="promotions">Promotions</SelectItem>
                      <SelectItem value="announcements">Announcements</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Only users who have opted in to this category will receive the notification.</p>
                </div>
                <div className="grid gap-2 sm:gap-3">
                  <Label htmlFor="imageUrl" className="flex items-center gap-2 text-sm">
                    <ImageIcon className="h-4 w-4" />
                    Image URL <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input 
                    id="imageUrl" 
                    value={imageUrl} 
                    onChange={(e) => handleImageUrlChange(e.target.value)} 
                    placeholder="https://example.com/image.png" 
                    className={imageUrlError ? 'border-red-500' : ''} 
                  />
                  {imageUrlError ? (
                    <span className="text-xs text-red-500">{imageUrlError}</span>
                  ) : (
                    <p className="text-xs text-muted-foreground">Add an image to display with the notification (supported by Notifee).</p>
                  )}
                  {imageUrl && isValidUrl(imageUrl) && (
                    <div className="mt-2 p-2 border rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                      <img 
                        src={imageUrl} 
                        alt="Notification preview" 
                        className="max-h-24 sm:max-h-32 rounded object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                <Button onClick={handleSendNotification} className="w-full" disabled={sending || !title.trim() || !message.trim() || titleError !== '' || messageError !== '' || imageUrlError !== ''}>
                  {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Send className="mr-2 h-4 w-4" />Send to {APP_TARGET_LABELS[appTarget]}</>}
                </Button>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="border-0 shadow-none sm:border sm:shadow-sm">
                <CardHeader className="px-0 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Users with Push Notifications</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Send individual notifications to specific users.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadUsers} disabled={loadingUsers} className="w-full sm:w-auto">
                    {loadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span className="ml-2">Refresh</span>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-3 sm:p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">{searchQuery ? 'No users found matching your search' : 'No users with push tokens'}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[150px]">User</TableHead>
                            <TableHead className="hidden sm:table-cell">Push Enabled</TableHead>
                            <TableHead className="hidden md:table-cell">Preferences</TableHead>
                            <TableHead className="hidden lg:table-cell text-center">Devices</TableHead>
                            <TableHead className="text-center min-w-[80px]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-sm truncate">{user.name}</span>
                                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                                  {/* Mobile: Show status inline */}
                                  <div className="flex items-center gap-2 mt-1 sm:hidden">
                                    {user.push_notification_enabled ? (
                                      <Badge variant="default" className="bg-green-500 text-xs px-1.5 py-0">On</Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs px-1.5 py-0">Off</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                      <Smartphone className="h-3 w-3" />{user.active_token_count}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {user.push_notification_enabled ? (
                                  <Badge variant="default" className="bg-green-500">Enabled</Badge>
                                ) : (
                                  <Badge variant="secondary">Disabled</Badge>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex flex-wrap gap-1">
                                  {user.preferences.order_updates && <Badge variant="outline" className="text-xs">Orders</Badge>}
                                  {user.preferences.promotions && <Badge variant="outline" className="text-xs">Promos</Badge>}
                                  {user.preferences.announcements && <Badge variant="outline" className="text-xs">News</Badge>}
                                  {user.preferences.general && <Badge variant="outline" className="text-xs">General</Badge>}
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                                  <span>{user.active_token_count}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button variant="outline" size="sm" onClick={() => openSendDialog(user)} disabled={!user.push_notification_enabled} className="h-8 px-2 sm:px-3">
                                  <Send className="h-3.5 w-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">Send</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card className="border-0 shadow-none sm:border sm:shadow-sm">
                <CardHeader className="px-0 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Notification History</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">A log of all previously sent push notifications.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadHistory} disabled={loading} className="w-full sm:w-auto">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span className="ml-2">Refresh</span>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No notifications sent yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Title</TableHead>
                            <TableHead className="hidden md:table-cell min-w-[150px]">Message</TableHead>
                            <TableHead className="hidden lg:table-cell">Category</TableHead>
                            <TableHead className="hidden xl:table-cell">App</TableHead>
                            <TableHead className="hidden xl:table-cell text-center">Image</TableHead>
                            <TableHead className="hidden sm:table-cell text-center">Recipients</TableHead>
                            <TableHead className="min-w-[90px]">Status</TableHead>
                            <TableHead className="hidden lg:table-cell text-right min-w-[120px]">Date</TableHead>
                            <TableHead className="text-center min-w-[60px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.map((notif) => (
                            <TableRow key={notif.id}>
                              <TableCell>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate max-w-[120px] sm:max-w-[150px]">{notif.title}</p>
                                  {/* Mobile: Show message preview and date */}
                                  <p className="text-xs text-muted-foreground truncate max-w-[120px] md:hidden">{notif.message}</p>
                                  <p className="text-xs text-muted-foreground lg:hidden mt-0.5">{format(new Date(notif.created_at), 'MMM d, HH:mm')}</p>
                                  {/* Mobile: Show recipients */}
                                  <div className="flex items-center gap-2 mt-1 sm:hidden">
                                    <span className="text-xs text-muted-foreground">{notif.recipient_count} recipients</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell max-w-[150px] lg:max-w-[200px]">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild><span className="cursor-help text-sm truncate block">{notif.message}</span></TooltipTrigger>
                                    <TooltipContent className="max-w-[300px]"><p>{notif.message}</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell"><Badge variant="secondary" className="capitalize text-xs">{getCategoryLabel(notif.category || 'general')}</Badge></TableCell>
                              <TableCell className="hidden xl:table-cell">
                                <Badge variant="outline" className="text-xs">
                                  {notif.target_app ? APP_TARGET_LABELS[notif.target_app] : 'All apps'}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden xl:table-cell text-center">
                                {notif.image_url ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex justify-center">
                                          <ImageIcon className="h-4 w-4 text-green-500 cursor-help" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-[300px]">
                                        <img src={notif.image_url} alt="Notification image" className="max-h-32 rounded" />
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-center">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild><span className="cursor-help text-sm">{notif.recipient_count}</span></TooltipTrigger>
                                    <TooltipContent><p>Sent: {notif.sent_count || 0}</p><p>Failed: {notif.failed_count || 0}</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {getStatusIcon(notif.delivery_status)}
                                  <Badge variant={getStatusBadgeVariant(notif.delivery_status)} className="capitalize text-xs">{notif.delivery_status}</Badge>
                                </div>
                                {notif.error && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild><span className="text-xs text-red-500 cursor-help">View error</span></TooltipTrigger>
                                      <TooltipContent className="max-w-[300px]"><p className="text-red-500">{notif.error}</p></TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-right text-xs whitespace-nowrap">{format(new Date(notif.created_at), 'PPp')}</TableCell>
                              <TableCell className="text-center">
                                {notif.delivery_status === 'failed' && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => handleRetryNotification(notif.id)} disabled={retrying === notif.id} className="h-8 w-8 p-0">
                                          {retrying === notif.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Retry notification</p></TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Individual Notification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Send Notification to {selectedUser?.name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Send a push notification directly to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dialog-title" className="text-sm">Title <span className="text-red-500">*</span></Label>
              <Input id="dialog-title" value={dialogTitle} onChange={(e) => setDialogTitle(e.target.value)} placeholder="Notification title" maxLength={50} />
              <span className="text-xs text-muted-foreground">{dialogTitle.length}/50 characters</span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dialog-message" className="text-sm">Message <span className="text-red-500">*</span></Label>
              <Textarea id="dialog-message" value={dialogMessage} onChange={(e) => setDialogMessage(e.target.value)} placeholder="Notification message" className="min-h-[80px] sm:min-h-[100px]" maxLength={200} />
              <span className="text-xs text-muted-foreground">{dialogMessage.length}/200 characters</span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dialog-category" className="text-sm">Category</Label>
              <Select value={dialogCategory} onValueChange={setDialogCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="order_updates">Order Updates</SelectItem>
                  <SelectItem value="promotions">Promotions</SelectItem>
                  <SelectItem value="announcements">Announcements</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm">Target App</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {APP_TARGET_OPTIONS.map((option) => {
                  const active = dialogAppTarget === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDialogAppTarget(option.value)}
                      className={`rounded-lg border p-3 text-left transition-all ${active ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20' : 'border-border bg-background hover:border-green-300 hover:bg-muted/40'}`}
                    >
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dialog-image-url" className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4" />
                Image URL <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input 
                id="dialog-image-url" 
                value={dialogImageUrl} 
                onChange={(e) => setDialogImageUrl(e.target.value)} 
                placeholder="https://example.com/image.png" 
              />
              <span className="text-xs text-muted-foreground">Add an image to display with the notification.</span>
            </div>
            {selectedUser && (
              <div className="bg-muted p-2 sm:p-3 rounded-lg text-sm">
                <p className="font-medium mb-1 text-xs sm:text-sm">User Preferences:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedUser.preferences.order_updates && <Badge variant="outline" className="text-xs">Orders</Badge>}
                  {selectedUser.preferences.promotions && <Badge variant="outline" className="text-xs">Promos</Badge>}
                  {selectedUser.preferences.announcements && <Badge variant="outline" className="text-xs">News</Badge>}
                  {selectedUser.preferences.general && <Badge variant="outline" className="text-xs">General</Badge>}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSendToUser} disabled={sendingToUser || !dialogTitle.trim() || !dialogMessage.trim()} className="w-full sm:w-auto">
              {sendingToUser ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Send className="mr-2 h-4 w-4" />Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
