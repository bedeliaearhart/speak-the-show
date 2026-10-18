// ElevenLabs voice agent: it hears the show and calls place_show, which runs the same planner as the Plan button.
const widget = document.querySelector('elevenlabs-convai');
if (widget) {
  widget.addEventListener('elevenlabs-convai:call', (event) => {
    event.detail.config.clientTools = {
      place_show: async ({ text }) => {
        document.getElementById('concept').value = text;
        return await window.planShow(text);
      },
    };
  });
}

// The widget stays hidden until the A2 button opens it, so it never covers the page.
const btn = document.getElementById('a2Btn');
if (btn && widget) btn.onclick = () => {
  const open = widget.style.display === 'none';
  widget.style.display = open ? '' : 'none';
  btn.textContent = open ? 'Hide the A2' : 'Call the A2 (ElevenLabs)';
};
