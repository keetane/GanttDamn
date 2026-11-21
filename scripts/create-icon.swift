import AppKit
let output = CommandLine.arguments[1]
let image = NSImage(size: NSSize(width: 1024, height: 1024))
image.lockFocus()
NSColor.clear.setFill()
NSRect(x:0,y:0,width:1024,height:1024).fill()
NSColor(calibratedRed:0.13,green:0.37,blue:0.29,alpha:1).setFill()
NSBezierPath(roundedRect:NSRect(x:64,y:64,width:896,height:896),xRadius:200,yRadius:200).fill()
let bars:[(CGFloat,CGFloat,CGFloat)] = [(220,660,330),(330,450,470),(500,240,300)]
for (x,y,w) in bars {
 NSColor(calibratedRed:0.84,green:0.93,blue:0.85,alpha:1).setFill()
 NSBezierPath(roundedRect:NSRect(x:x,y:y,width:w,height:105),xRadius:24,yRadius:24).fill()
}
image.unlockFocus()
let bitmap = NSBitmapImageRep(data:image.tiffRepresentation!)!
try bitmap.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:output))
