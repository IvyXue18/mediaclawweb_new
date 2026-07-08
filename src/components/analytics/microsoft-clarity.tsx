export function MicrosoftClarity({ projectId }: { projectId: string }) {
  const id = projectId.trim();
  if (!id || !/^[a-z0-9]+$/i.test(id)) return null;

  return (
    <script
      id="microsoft-clarity-init"
      async
      dangerouslySetInnerHTML={{
        __html: `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script",${JSON.stringify(id)});
`,
      }}
    />
  );
}
