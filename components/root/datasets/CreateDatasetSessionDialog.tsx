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
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import { createDataset } from "@/app/actions/dataset.action";
import { DatasetSchema } from "@/server/validators/dataset.validator";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { redirect } from "next/navigation";

type DatasetFormType = z.infer<typeof DatasetSchema>;

export default function CreateDatasetDatasetDialog() {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<DatasetFormType>({
    resolver: zodResolver(DatasetSchema),
    defaultValues: {
      title: "",
      description: "",
      startedAt: new Date(),
      endedAt: undefined,
      status: "PENDING",
      captureType: "IMAGE_CAPTURE",
      location: "",
    },
  });

  const onSubmit = (values: DatasetFormType) => {
    startTransition(async () => {
      try {
        const dataset = await createDataset(values);
        toast.success("Sesi berhasil ditambahkan");
        setOpen(false);
        form.reset();
        redirect(`/dataset/${dataset.id}`);
      } catch {
        toast.error("Gagal membuat sesi");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full px-4 py-2">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Dataset
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Dataset</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Create a new dataset session
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4">
          <FieldGroup>
            <div className="grid gap-4">
              {/* Title */}
              <Controller
                name="title"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Judul Sesi</FieldLabel>
                    <InputGroup>
                      <InputGroupInput {...field} />
                    </InputGroup>
                  </Field>
                )}
              />

              {/* Description */}
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Deskripsi</FieldLabel>
                    <Textarea {...field} />
                  </Field>
                )}
              />

              {/* Started At */}
              <div className="flex gap-3">
                <Controller
                  name="startedAt"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Tanggal Mulai</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          type="date"
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                        />
                      </InputGroup>
                    </Field>
                  )}
                />

                {/* Ended At */}
                <Controller
                  name="endedAt"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Tanggal Selesai</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          type="date"
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? new Date(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </InputGroup>
                    </Field>
                  )}
                />
              </div>
              {/* Status */}
              <div className="flex gap-3">
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">PENDING</SelectItem>
                          <SelectItem value="RUNNING">RUNNING</SelectItem>
                          <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                {/* Capture Type */}
                <Controller
                  name="captureType"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Capture Type</FieldLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IMAGE_CAPTURE">
                            IMAGE_CAPTURE
                          </SelectItem>
                          <SelectItem value="VIDEO">VIDEO</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>

              {/* Location */}
              <Controller
                name="location"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Lokasi</FieldLabel>
                    <InputGroup>
                      <InputGroupInput {...field} />
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
                {isPending ? "Loading..." : "Submit"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
