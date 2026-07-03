import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { apiPost } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type QueryTaskResult = {
  id: string;
  status: string;
};

function RefreshAITaskPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => apiPost<QueryTaskResult>('/api/ai/query', { taskId: id }),
    onSuccess: (task) => {
      toast.success(m['activity.ai_tasks.refresh_success']());
      setTimeout(() => {
        navigate({ to: '/activity/ai-tasks' });
      }, 600);
      return task;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    mutation.mutate();
    // Run once for the current route id. A repeated click can be done through the retry button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isDone = mutation.isSuccess;
  const isError = mutation.isError;

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg" data-ai-task-refresh-page>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary rounded-md p-2">
              {mutation.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : isDone ? (
                <CheckCircle2 className="size-5" />
              ) : isError ? (
                <AlertCircle className="text-destructive size-5" />
              ) : (
                <RefreshCw className="size-5" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                {m['activity.ai_tasks.refresh_title']()}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {m['activity.ai_tasks.refresh_description']()}
              </p>
            </div>
          </div>

          <div className="bg-muted/40 rounded-lg p-3 text-sm">
            <span className="text-muted-foreground">
              {m['activity.ai_tasks.fields.task_id']()}:
            </span>{' '}
            <code>{id}</code>
          </div>

          {mutation.data ? (
            <p className="text-sm" data-ai-task-refresh-success>
              {m['activity.ai_tasks.refresh_status']({
                status: mutation.data.status,
              })}
            </p>
          ) : null}

          {mutation.error instanceof Error ? (
            <p
              className="text-destructive text-sm"
              role="alert"
              data-ai-task-refresh-error
            >
              {mutation.error.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {isError ? (
              <button
                type="button"
                className={buttonVariants({ className: 'gap-1' })}
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                <RefreshCw className="size-4" />
                {m['activity.ai_tasks.retry_refresh']()}
              </button>
            ) : null}
            <Link
              href="/activity/ai-tasks"
              className={buttonVariants({ variant: 'outline' })}
            >
              {m['activity.ai_tasks.back_to_tasks']()}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/activity/ai-tasks/$id/refresh')({
  component: RefreshAITaskPage,
});
