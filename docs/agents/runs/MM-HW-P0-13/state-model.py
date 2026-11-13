"""Finite logical proposal model, NOT firmware or a proof of physical timing/isolation."""
from dataclasses import dataclass, replace
import itertools,json

@dataclass(frozen=True)
class State:
    phase:str='WAIT_ARM'
    arm_q:bool=False
    rel_q:bool=False
    previous_a:bool=False
    previous_r:bool=False

def step(s,*,H=True,K=True,O=True,N=True,A=False,R=False,RUN_REQUEST=True,
         arm_timer_done=False,off_timer_done=False,rel_timer_done=False,commit=False,release_expired=False):
    # Timer completion inputs abstract physical qualifiers. They have no hardware guarantee here.
    n=replace(s,previous_a=A,previous_r=R)
    if s.phase=='COMMITTED':
        return State(previous_a=A,previous_r=R) if H and K and N and not A and not R else n
    if not H or (not K and s.phase in ['WAIT_ARM','RUN','OFF_VERIFY','OFF_READY','RELEASE_GRANTED']):
        return replace(n,phase='FAULT',arm_q=False,rel_q=False)
    if s.phase=='FAULT':
        return State(previous_a=A,previous_r=R) if K and not A and not R else n
    if s.phase=='WAIT_ARM':
        if A and not s.previous_a and s.arm_q and RUN_REQUEST:
            return replace(n,phase='RUN',arm_q=False,rel_q=False)
        return replace(n,arm_q=(not A and (s.arm_q or arm_timer_done)),rel_q=False)
    if s.phase=='RUN':
        return replace(n,phase='OFF_VERIFY',arm_q=False,rel_q=False) if not RUN_REQUEST else n
    if s.phase=='OFF_VERIFY':
        # OFF timer restarts whenever O is absent. It does not hold a RUN grant.
        return replace(n,phase='OFF_READY',arm_q=False,rel_q=False) if O and off_timer_done else n
    if s.phase in ['OFF_READY','RELEASE_GRANTED'] and not O:
        return replace(n,phase='FAULT',arm_q=False,rel_q=False)
    if s.phase=='OFF_READY':
        if R and not s.previous_r and s.rel_q and N:
            return replace(n,phase='RELEASE_GRANTED',arm_q=False,rel_q=False)
        return replace(n,rel_q=(N and not R and (s.rel_q or rel_timer_done)),arm_q=False)
    if s.phase=='RELEASE_GRANTED':
        if commit:return replace(n,phase='COMMITTED',arm_q=False,rel_q=False)
        if release_expired:return replace(n,phase='OFF_VERIFY',arm_q=False,rel_q=False)
        return n
    raise AssertionError('Unknown phase')

def grants(s):return {'run':s.phase=='RUN','release':s.phase=='RELEASE_GRANTED'}

checks=[]
def record(name,condition):
    assert condition,name
    checks.append(name)
s=step(State(),arm_timer_done=True)
s=step(s,A=True)
record('fresh ARM edge consumes qualified LOW and preserves new RUN grant',s.phase=='RUN' and not s.arm_q)
record('held HIGH resets timer but does not erase RUN grant',step(s,A=True).phase=='RUN')
s=step(s,A=True,RUN_REQUEST=False)
record('RUN_REQUEST withdrawal removes RUN before OFF verification',s.phase=='OFF_VERIFY' and not grants(s)['run'])
s=step(s,A=True,off_timer_done=True)
record('continuous OFF qualification enters OFF_READY',s.phase=='OFF_READY')
record('leaving OFF_VERIFY resets timer, not maintained OFF_READY proof',step(s,A=True).phase=='OFF_READY')
s=step(s,A=True,rel_timer_done=True)
s=step(s,A=True,R=True)
record('fresh RELEASE edge consumes qualified LOW and preserves release grant',s.phase=='RELEASE_GRANTED' and not s.rel_q)
record('intentional follower motion does not reset grant merely by ending neutral qualification',step(s,A=True,R=True,N=False).phase=='RELEASE_GRANTED')
record('loss of physical OFF clears release grant',step(s,A=True,R=True,O=False).phase=='FAULT')
record('loss of H dominates simultaneous qualifying ARM edge',step(State(arm_q=True),H=False,A=True).phase=='FAULT')
record('loss of H dominates simultaneous qualifying RELEASE edge',step(State(phase='OFF_READY',rel_q=True),H=False,R=True).phase=='FAULT')
record('held ARM at initial recovery cannot auto-run',step(State(previous_a=True),A=True,arm_timer_done=True).phase=='WAIT_ARM')
record('held RELEASE at OFF_READY entry cannot auto-release',step(State(phase='OFF_READY',previous_r=True),R=True,rel_timer_done=True).phase=='OFF_READY')
record('COMMITTED never grants RUN without relock and a new arm cycle',not grants(step(State(phase='COMMITTED'),K=False,A=True,R=True))['run'])
expired=step(State(phase='RELEASE_GRANTED',previous_r=True),R=True,release_expired=True)
record('release expiration removes grant and restarts OFF qualification',expired.phase=='OFF_VERIFY' and not grants(expired)['release'])
after=step(expired,R=True,off_timer_done=True)
record('held RELEASE after expiry cannot auto-retry',step(after,R=True,rel_timer_done=True).phase=='OFF_READY')
record('fault simultaneous with expiration clears grant',step(State(phase='RELEASE_GRANTED'),H=False,release_expired=True).phase=='FAULT')
record('commit and expiration together cannot retain release grant',not grants(step(State(phase='RELEASE_GRANTED'),commit=True,release_expired=True))['release'])

count=0
for phase,H,K,O,N,A,R,aq,rq,pa,pr,at,ot,rt,c,expired,run_request in itertools.product(
 ['WAIT_ARM','RUN','OFF_VERIFY','OFF_READY','RELEASE_GRANTED','COMMITTED','FAULT'],*[ [False,True] for _ in range(16)]):
    old=State(phase,aq,rq,pa,pr)
    nxt=step(old,H=H,K=K,O=O,N=N,A=A,R=R,RUN_REQUEST=run_request,arm_timer_done=at,off_timer_done=ot,rel_timer_done=rt,commit=c,release_expired=expired)
    g=grants(nxt);count+=1
    assert not(g['run'] and g['release'])
    if not H:assert not g['run'] and not g['release']
    if phase in ['OFF_READY','RELEASE_GRANTED'] and not O:assert not g['release']
    if phase=='RELEASE_GRANTED' and expired:assert not g['release']
    if g['run'] and phase!='RUN':assert phase=='WAIT_ARM' and aq and A and not pa and H and K
    if g['release'] and phase!='RELEASE_GRANTED':assert phase=='OFF_READY' and rq and R and not pr and H and K and O and N
print(json.dumps({'classification':'Logical model only; physical qualifier/reset assertion, timing and fault-containment NOT_PROVEN',
 'scenario_checks':checks,'enumerated_transitions':count,'passed':True,
 'limits':['no implemented gates/latches or GPIO assignment','timer_done abstracts actual continuously qualified output','not a physical delay/race/default proof','does not remove mechanical precommit counterexample']},indent=2))
