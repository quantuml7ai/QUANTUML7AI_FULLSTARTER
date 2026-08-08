import { redirect } from 'next/navigation'

export default function Contact() {
  redirect('/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support')
}
