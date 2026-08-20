import { useState } from 'react';
import { Menu } from 'lucide-react';

import { DocNavList } from '@/components/docs/doc-nav-list';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function DocMobileNav({ activeSlug }: { activeSlug: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <Menu className="size-4" />
            文档目录
          </Button>
        }
      />
      <SheetContent side="left" className="overflow-y-auto p-0">
        <SheetHeader>
          <SheetTitle>文档目录</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8">
          <DocNavList
            activeSlug={activeSlug}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
