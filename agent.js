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
