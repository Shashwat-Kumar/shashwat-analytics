"""Simulate a test-wise guesser who knows nothing about AI. Score each heuristic on the bank."""
import re, json, statistics as st, sys, collections
def heuristics(q):
    o=q['options']; L=[len(x) for x in o]; med=st.median(L)
    words=lambda s:set(re.findall(r"[a-z]{4,}",s.lower()))
    stem=words(q['stem']+' '+q.get('code',''))
    absolute=re.compile(r"\b(always|never|only|every|all|any|guarantee[sd]?|impossible|nothing|none)\b",re.I)
    keep=[i for i in range(4) if not absolute.search(o[i])] or list(range(4))
    return {
      'pick longest': max(range(4),key=lambda i:L[i]),
      'pick shortest': min(range(4),key=lambda i:L[i]),
      'pick closest to median length': min(range(4),key=lambda i:abs(L[i]-med)),
      'drop absolutes, then longest': max(keep,key=lambda i:L[i]),
      'drop absolutes, then median-ish': min(keep,key=lambda i:abs(L[i]-med)),
      'most word overlap with stem': max(range(4),key=lambda i:len(words(o[i])&stem)),
      'least word overlap with stem': min(range(4),key=lambda i:len(words(o[i])&stem)),
      'always pick B': 1,
    }
if __name__=='__main__':
    qs=json.load(open(sys.argv[1]))['questions']
    score=collections.Counter()
    for q in qs:
        for k,v in heuristics(q).items(): score[k]+= (v==q['correct'])
    for k,v in score.most_common(): print(f"{v/len(qs):6.1%}  {k}")
