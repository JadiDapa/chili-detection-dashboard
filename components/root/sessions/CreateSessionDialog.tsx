"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { PlusCircle } from "lucide-react";

import { createSession } from "@/app/actions/sessions.actions";
import { SessionSchema } from "@/server/validators/session.validator";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

type SessionFormType = z.infer<typeof SessionSchema>;

export default function CreateDatasetSessionDialog() {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<SessionFormType>({
    resolver: zodResolver(SessionSchema),
    defaultValues: {
      status: "PENDING",
      column: 8,
      row: 2,
      title: "",
      description: "",
    },
  });

  const onSubmit = (values: SessionFormType) => {
    startTransition(async () => {
      try {
        await createSession(values);
        toast.success("Sesi Terbaru Berhasi Ditambahkan");
        setOpen(false);
        form.reset();
      } catch {
        toast.error("Gagal Membuat Sesi");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full px-4 py-2">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Session
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <p className="text-muted-foreground -mt-1 text-sm">
            Create a new session to manage your items
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4">
          <FieldGroup {...form}>
            <div className="grid gap-4">
              {/* Nama Session */}
              <Controller
                name="title"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Judul Sesi</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        placeholder="Contoh: Panen Harian"
                      />
                    </InputGroup>
                  </Field>
                )}
              />

              {/* Deskripsi */}
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Deskripsi</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        placeholder="Alasan membuat sesi ini"
                      />
                    </InputGroup>
                  </Field>
                )}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner /> : "Submit"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
