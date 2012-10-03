function LocalDebug($dom) {
    this.log = function() {
        var str = Array.prototype.slice.apply(arguments).join(",");
        $dom.append("<div style='text-align: left;'>"+str+"</div>");
    }
}