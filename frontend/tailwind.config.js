/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ 
    "./public/index.html",
    "./src/**/*.{html,jsx,js}"
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
         // 1 grid column with width of 200px
         'new1': 'repeat(1, 700px)'
         }
     },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ]
}
