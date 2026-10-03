import { FunctionsHttpError } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session-provider';
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase/client';

export type ChatMessage = { id: string; role: 'user' | 'brote'; content: string; created_at: string };

/** Why a message could not go: each has its own words in `chat.errors.*`. */
export type ChatError = 'not_enabled' | 'daily_limit' | 'pro_required' | 'not_configured' | 'generic';

const chatKey = (userId: string | undefined) => ['brote-chat', userId];

/** The conversation, oldest first (the last 60 messages). */
export function useBroteChat() {
  const { session } = useSession();
  return useQuery({
    queryKey: chatKey(session?.user.id),
    enabled: !!session,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('coach_chat')
        .select('id, role, content, created_at')
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data as ChatMessage[]).reverse();
    },
  });
}

async function errorCode(error: unknown): Promise<ChatError> {
  if (!(error instanceof FunctionsHttpError)) return 'generic';
  const body = (await error.context.json().catch(() => null)) as { error?: string } | null;
  const code = body?.error;
  return code === 'not_enabled' || code === 'daily_limit' || code === 'pro_required' || code === 'not_configured'
    ? code
    : 'generic';
}

/**
 * Sends a question; the question shows at once (optimistic) and Brote's answer replaces the
 * "thinking" bubble when it arrives. `remaining` is how many messages are left today.
 */
export function useSendToBrote() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const key = chatKey(session?.user.id);
  return useMutation({
    networkMode: 'always',
    mutationFn: async (message: string) => {
      const { data, error } = await supabase.functions.invoke('coach-chat', { body: { message } });
      if (error) throw new Error(await errorCode(error));
      return data as { reply: string; remaining: number };
    },
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChatMessage[]>(key);
      const optimistic: ChatMessage = {
        id: `pending-${Date.now()}`,
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<ChatMessage[]>(key, (old) => [...(old ?? []), optimistic]);
      return { previous };
    },
    onError: (_error, _message, context) => queryClient.setQueryData(key, context?.previous),
    onSuccess: () => track('brote_chat_sent'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** Deletes the whole conversation (the person's right, and a fresh start). */
export function useClearChat() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('coach_chat').delete().eq('user_id', session!.user.id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: chatKey(session?.user.id) }),
  });
}
