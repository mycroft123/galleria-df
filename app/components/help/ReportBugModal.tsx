// 'use client'

import { useState, useEffect, Fragment } from 'react'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Basic from './DragAndDropFiles' // Your file upload component
import { toast } from "react-toastify";

const MAX_CHARS = 1000
const MIN_CHARS = 50

const BugReportSchema = z.object({
  bugDescription: z
    .string()
    .min(MIN_CHARS, { message: `Please provide at least ${MIN_CHARS} characters.` })
    .max(MAX_CHARS, { message: `Please keep your message under ${MAX_CHARS} characters.` })
    .trim()
})

type BugReportForm = z.infer<typeof BugReportSchema>

export default function ReportBugModal({ isModalOpen, setIsModalOpen }: any) {
  const [screenshots, setScreenshots] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<BugReportForm>({
    resolver: zodResolver(BugReportSchema),
    mode: 'onSubmit',
  })

  const onSubmit = async (data: BugReportForm) => {
    try {
      const formData = new FormData();
      formData.append('bugDescription', data.bugDescription);
      screenshots.forEach((screenshot) => {
        formData.append('screenshots', screenshot);
      });

      const response = await fetch('/api/bug-report', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setIsModalOpen(false);
        toast.success('Bug report submitted successfully!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored"
        });
      } else {
        toast.error(result.error || 'Failed to submit bug report', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored"
        });
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast.error('Failed to submit bug report. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored"
      });
    }
  }

  const handleScreenshotChange = (files: File[]) => {
    setScreenshots(files)
  }

  const removeScreenshot = (idx: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleClose = () => {
    setIsModalOpen(false)
    
    setTimeout(() => {
      reset()
      setScreenshots([])
    }, 300) 
  }

  useEffect(() => {
    if (!isModalOpen) {
      reset()
      setScreenshots([])
    }
  }, [isModalOpen, reset])

  const shouldShowError = errors.bugDescription;

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-[4rem] right-[2.25rem] z-10 bg-[#31796b] ring-1 ring-inset ring-white hover:bg-opacity-80 text-white font-semibold rounded-lg py-2 px-4 transition-all"
        aria-label="Open Support Modal"
      >
        Report bug
      </button>

      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleClose}>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            {/* Backdrop Transition */}
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
            </TransitionChild>

            <div className="flex min-h-full justify-center p-4 text-center items-center sm:p-0">
              {/* Modal Panel Transition */}
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="bg-radial-gradient px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <DialogTitle as="h2" className="text-white text-2xl font-semibold">
                      Report bug
                    </DialogTitle>

                    <p className="mt-2 text-sm text-gray-300">
                      Noticed something broken or behaving unexpectedly?
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                      <div>
                        <label className="block font-medium mb-2 text-white">Screenshots</label>

                        <Basic onChange={handleScreenshotChange} />

                        {screenshots.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {screenshots.map((file, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Screenshot ${idx + 1}`}
                                  className="max-h-32 rounded w-[40px] h-[20px] sm:w-[70px] sm:h-[35px] object-cover"
                                />
                                <div className="absolute inset-0 hidden group-hover:flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => removeScreenshot(idx)}
                                    className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-black bg-opacity-50 text-white rounded-full text-sm font-semibold"
                                    aria-label="Remove screenshot"
                                  >
                                    <span className="mt-[-1px]">×</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-medium mb-2 text-white">
                          Describe issue <span className="text-red-500">*</span>
                        </label>

                        <textarea
                          {...register('bugDescription')}
                          rows={3}
                          className={`w-full rounded-lg p-2 text-base text-gray-200 bg-[#222222] border-1 focus:outline-none focus:ring-0 focus:border-[#515d5b] 
                            ${ shouldShowError
                              ? 'border-red-500'
                              : 'border-[#515d5b]'
                          }`}
                          placeholder="Describe the problem in detail..."
                        />

                        {shouldShowError && (
                          <p className="mt-[-5px] text-sm text-red-500">{errors.bugDescription?.message}</p>
                        )}
                      </div>

                      <div className="bg-[#222222] pb-3 flex justify-center">
                        <button
                          type="submit"
                          className="rounded-lg px-4 py-2 text-white font-semibold bg-[#31796b] ring-1 ring-inset ring-white text-base transition-all hover:bg-opacity-80"
                        >
                          Report bug
                        </button>
                      </div>
                    </form>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-0 right-3 text-xl "
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
