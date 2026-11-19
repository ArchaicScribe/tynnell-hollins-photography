import type { Data } from '@measured/puck'

// The Rising Roots Contact page as data: pure and free of path aliases. The
// live Contact page holds only a form, so there are no words to carry over.
// The form lets the visitor pick the wedding or portrait inquiry; the contact
// details, questions and testimonials stay hidden until Tynnell fills them in.

const style = { background: 'transparent', spacing: 'normal' }

export function buildContact(): Data {
  return {
    root: {},
    content: [
      {
        type: 'Hero',
        props: {
          id: 'contact-hero',
          photoMovement: 'none',
          layout: 'bottom',
          eyebrow: '',
          heading: '',
          subheading: '',
          imageUrl: '',
          height: '45vh',
          backgroundBehavior: 'scroll',
          align: 'left',
          buttonText: '',
          buttonHref: '',
          cornerLeft: '',
          cornerRight: '',
        },
      },
      {
        type: 'InquiryForm',
        props: { id: 'contact-inquiry', kind: 'choice', eyebrow: '', heading: '', subtext: '', ...style },
      },
      {
        // Where to find her: email, social links, the area she covers.
        type: 'Statement',
        props: { id: 'contact-details', lead: '', text: '', closing: '', style: 'text', align: 'center', hideUntilFilled: true, ...style },
      },
      {
        type: 'Accordion',
        props: { id: 'contact-faq', heading: '', items: [{ title: '', body: '' }], hideUntilFilled: true, ...style },
      },
      {
        type: 'LiveTestimonials',
        props: { id: 'contact-kind-words', stickyPhotoScroll: 'slider', hideUntilFilled: true, ...style },
      },
    ],
  } as Data
}
