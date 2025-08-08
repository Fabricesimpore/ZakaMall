import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useNotifications } from "@/hooks/useNotifications";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function Chat() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { showNotification, requestPermission, permission } = useNotifications();

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'message_received' && message.roomId === selectedRoom?.id) {
      // Invalidate messages query to fetch new messages
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms', selectedRoom.id, 'messages'] });
    } else if (message.type === 'new_notification') {
      // Show browser notification
      if (permission === 'granted') {
        showNotification(message.notification.title, {
          body: message.notification.body,
          tag: `chat-${message.notification.roomId}`,
        });
      }
      // Refresh chat rooms to update unread counts
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms'] });
    }
    // Always refresh chat rooms list for any message
    if (message.type === 'message_received') {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms'] });
    }
  }, [selectedRoom?.id, showNotification, permission]);

  const { sendMessage: sendWebSocketMessage } = useWebSocket(handleWebSocketMessage);

  // Request notification permission on component mount
  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Mark messages as read when selecting a room
  const markAsReadMutation = useMutation({
    mutationFn: async (roomId: string) => {
      return await apiRequest('POST', `/api/chat/rooms/${roomId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms'] });
    },
  });

  useEffect(() => {
    if (selectedRoom?.id) {
      markAsReadMutation.mutate(selectedRoom.id);
    }
  }, [selectedRoom?.id]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Reconnexion en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: chatRooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['/api/chat/rooms'],
    enabled: !!user,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/chat/rooms', selectedRoom?.id, 'messages'],
    enabled: !!selectedRoom?.id,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['/api/users/search', searchQuery],
    enabled: searchQuery.length > 2,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('POST', `/api/chat/rooms/${selectedRoom.id}/messages`, { content });
    },
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms', selectedRoom?.id, 'messages'] });
      // Send WebSocket message to notify other participants
      sendWebSocketMessage({
        type: 'new_message',
        roomId: selectedRoom.id,
        message: newMessage
      });
      setMessageText("");
      scrollToBottom();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    },
  });

  const createChatMutation = useMutation({
    mutationFn: async ({ participantIds, name }: { participantIds: string[]; name?: string }) => {
      return await apiRequest('POST', '/api/chat/rooms', { participantIds, name });
    },
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms'] });
      setIsNewChatOpen(false);
      setSelectedUsers([]);
      setSearchQuery("");
      setSelectedRoom(newRoom);
      toast({
        title: "Succès",
        description: "Nouvelle conversation créée",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedRoom) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const handleUserSelect = (selectedUser: any) => {
    if (!selectedUsers.find(u => u.id === selectedUser.id)) {
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
  };

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateChat = () => {
    if (selectedUsers.length === 0) return;
    
    const participantIds = selectedUsers.map(u => u.id);
    const chatName = selectedUsers.length === 1 
      ? `${selectedUsers[0].firstName} ${selectedUsers[0].lastName}`
      : `Chat de groupe`;
      
    createChatMutation.mutate({ participantIds, name: chatName });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zaka-light">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex h-[calc(100vh-12rem)] bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Chat Rooms Sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zaka-dark">Messages</h2>
                <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-zaka-blue hover:bg-zaka-blue">
                      <i className="fas fa-plus mr-2"></i>
                      Nouveau
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Nouvelle conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Rechercher des utilisateurs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      
                      {/* Selected Users */}
                      {selectedUsers.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Participants sélectionnés:</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedUsers.map((user) => (
                              <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                                {user.firstName} {user.lastName}
                                <button
                                  onClick={() => handleUserRemove(user.id)}
                                  className="ml-1 text-gray-500 hover:text-red-500"
                                >
                                  <i className="fas fa-times text-xs"></i>
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Search Results */}
                      <ScrollArea className="h-48">
                        {searchResults && searchResults.length > 0 ? (
                          <div className="space-y-2">
                            {searchResults.map((searchUser: any) => (
                              <div
                                key={searchUser.id}
                                className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => handleUserSelect(searchUser)}
                              >
                                <Avatar className="w-8 h-8 mr-3">
                                  <AvatarImage src={searchUser.profileImageUrl || undefined} />
                                  <AvatarFallback className="bg-zaka-orange text-white text-xs">
                                    {searchUser.firstName?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{searchUser.firstName} {searchUser.lastName}</p>
                                  <p className="text-xs text-gray-500 capitalize">{searchUser.role}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : searchQuery.length > 2 ? (
                          <p className="text-center text-gray-500 py-4">Aucun utilisateur trouvé</p>
                        ) : null}
                      </ScrollArea>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsNewChatOpen(false)}>
                          Annuler
                        </Button>
                        <Button 
                          onClick={handleCreateChat}
                          disabled={selectedUsers.length === 0 || createChatMutation.isPending}
                          className="bg-zaka-orange hover:bg-zaka-orange"
                        >
                          {createChatMutation.isPending ? "Création..." : "Créer"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {roomsLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse p-3 border-b">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : chatRooms && chatRooms.length > 0 ? (
                <div>
                  {chatRooms.map((room: any) => (
                    <div
                      key={room.id}
                      className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedRoom?.id === room.id ? 'bg-zaka-light border-l-4 border-l-zaka-orange' : ''
                      }`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-zaka-blue text-white">
                              {room.type === 'group' ? (
                                <i className="fas fa-users"></i>
                              ) : (
                                room.name?.charAt(0) || 'C'
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {room.unreadCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full">
                              {room.unreadCount > 99 ? '99+' : room.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className={`font-medium text-sm truncate ${
                              room.unreadCount > 0 ? 'font-bold text-zaka-dark' : ''
                            }`}>
                              {room.name || 'Conversation'}
                            </h3>
                            {room.unreadCount > 0 && (
                              <div className="w-2 h-2 bg-zaka-orange rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {room.type === 'group' ? 'Groupe' : 'Direct'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <i className="fas fa-comments text-4xl mb-2"></i>
                  <p>Aucune conversation</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-zaka-orange text-white">
                        {selectedRoom.type === 'group' ? (
                          <i className="fas fa-users"></i>
                        ) : (
                          selectedRoom.name?.charAt(0) || 'C'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedRoom.name || 'Conversation'}</h3>
                      <p className="text-sm text-gray-500 capitalize">{selectedRoom.type}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-1">
                              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message: any) => {
                        const isOwn = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md`}>
                              {!isOwn && (
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={message.sender?.profileImageUrl || undefined} />
                                  <AvatarFallback className="bg-zaka-blue text-white text-xs">
                                    {message.sender?.firstName?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={`p-3 rounded-lg ${
                                  isOwn
                                    ? 'bg-zaka-orange text-white'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {!isOwn && (
                                  <p className="text-xs font-medium mb-1">
                                    {message.sender?.firstName} {message.sender?.lastName}
                                  </p>
                                )}
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${isOwn ? 'text-orange-100' : 'text-gray-500'}`}>
                                  {formatMessageTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-500">
                      <div>
                        <i className="fas fa-comment text-4xl mb-2"></i>
                        <p>Aucun message dans cette conversation</p>
                        <p className="text-sm">Envoyez le premier message!</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Tapez votre message..."
                      className="flex-1"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-zaka-orange hover:bg-zaka-orange"
                    >
                      {sendMessageMutation.isPending ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-paper-plane"></i>
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                <div>
                  <i className="fas fa-comments text-6xl mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">Sélectionnez une conversation</h3>
                  <p>Choisissez une conversation existante ou créez-en une nouvelle</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}