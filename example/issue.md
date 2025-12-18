The mirgrate data to file system , migrate all data is grayed out and not selectable. 

other issue: <p> cannot contain a nested <div>.
See this log for the ancestor stack trace.
(anonymous)	@	react-dom_client.js?v=2577f98d:2163

another issue: react-dom_client.js?v=2577f98d:2156 In HTML, <div> cannot be a descendant of <p>.
This will cause a hydration error.

  ...
    <FocusScope asChild={true} loop={true} trapped={true} onMountAutoFocus={function handleEvent} ...>
      <Primitive.div tabIndex={-1} asChild={true} ref={function} onKeyDown={function}>
        <Primitive.div.Slot tabIndex={-1} onKeyDown={function} ref={function}>
          <Primitive.div.SlotClone tabIndex={-1} onKeyDown={function} ref={function}>
            <DismissableLayer role="alertdialog" id="radix-_r_c_" aria-describedby="radix-_r_e_" ...>
              <Primitive.div role="alertdialog" id="radix-_r_c_" aria-describedby="radix-_r_e_" ...>
                <div role="alertdialog" id="radix-_r_c_" aria-describedby="radix-_r_e_" aria-labelledby="radix-_r_d_" ...>
                  <AlertDialogContent.Slottable>
                    <AlertDialogHeader>
                      <div data-slot="alert-dial..." className="flex flex-...">
                        <AlertDialogTitle>
                        <AlertDialogDescription>
                          <AlertDialogDescription data-slot="alert-dial..." className="text-muted...">
                            <DialogDescription __scopeDialog={{Dialog:[...]}} data-slot="alert-dial..." ...>
                              <Primitive.p id="radix-_r_e_" data-slot="alert-dial..." className="text-muted..." ...>
>                               <p
>                                 id="radix-_r_e_"
>                                 data-slot="alert-dialog-description"
>                                 className="text-muted-foreground text-sm"
>                                 ref={null}
>                               >
>                                 <div>
                                  ...
                    ...
                  ...
    ...

another issue: client:809 [vite] Failed to reload /src/components/MainLayout.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)